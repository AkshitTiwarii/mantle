// Mantle Atlas in the browser: loads the JSON shards scripts/build-index.mjs
// writes into public/index/ and ranks them client-side.

export type AtlasKind = 'skills' | 'connectors' | 'plugins'
export const ATLAS_KINDS: AtlasKind[] = ['skills', 'connectors', 'plugins']

export type AtlasStep = { command: string; where: 'terminal' | 'claude-code' | 'bundle' }

export type AtlasEntry = {
  key: string
  kind: AtlasKind
  name: string
  source: string
  installs: number
  description: string
  steps: AtlasStep[]
  url: string
  owner: string
  // Lowercased copies for ranking, made once on load.
  nn: string
  s: string
  d: string
}

export type AtlasMeta = { refreshed: string; counts: Record<AtlasKind, number> }

type Row = [name: string, source: string, installs: number, description: string, install: string, url: string, owner: string]

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

function steps(kind: AtlasKind, install: string): AtlasStep[] {
  // Plugins add a marketplace, then install from it: two slash commands that
  // can't be pasted as one prompt.
  if (kind === 'plugins') return install.split(/\s+&&\s+/).map(command => ({ command, where: 'claude-code' }))
  if (install.startsWith('mcpb:')) return [{ command: install.slice(5).trim(), where: 'bundle' }]
  return [{ command: install, where: 'terminal' }]
}

function entry(kind: AtlasKind, [name, source, installs, description, install, url, owner]: Row, i: number): AtlasEntry {
  // Skills that follow the skills.sh pattern ship without install and url.
  if (kind === 'skills') {
    install ||= `npx skills add ${source} --skill ${name}`
    url ||= `https://www.skills.sh/${source}/${name}`
  }
  return { key: `${kind}:${i}`, kind, name, source, installs, description, steps: steps(kind, install), url, owner, nn: normalize(name), s: source.toLowerCase(), d: description.toLowerCase() }
}

async function fetchJson<T>(path: string): Promise<T> {
  // Relative to the page, so the site works from a subpath too.
  const res = await fetch(`/index/${path}`)
  if (!res.ok) throw new Error(`index/${path} answered ${res.status}`)
  return res.json()
}

const shards = new Map<AtlasKind, Promise<AtlasEntry[]>>()
let meta: Promise<AtlasMeta> | undefined

// Each shard is fetched once per visit; a failed fetch is forgotten so Retry works.
export function loadShard(kind: AtlasKind): Promise<AtlasEntry[]> {
  let p = shards.get(kind)
  if (!p) {
    p = fetchJson<Row[]>(`${kind}.json`).then(rows => rows.map((r, i) => entry(kind, r, i)))
    p.catch(() => shards.delete(kind))
    shards.set(kind, p)
  }
  return p
}

export function loadMeta(): Promise<AtlasMeta> {
  meta ??= fetchJson<AtlasMeta>('meta.json')
  meta.catch(() => (meta = undefined))
  return meta
}

// ---- ranking -------------------------------------------------------------------

export function tokenize(query: string): string[] {
  return normalize(query).split(' ').filter(Boolean)
}

const WORD = /[\p{L}\p{N}]/u

// 3 when the token is a whole word in the text, 2 when it starts one, 1 when
// it only appears inside one.
function hit(text: string, token: string): number {
  let best = 0
  for (let at = text.indexOf(token); at >= 0 && best < 3; at = text.indexOf(token, at + 1)) {
    if (at > 0 && WORD.test(text[at - 1])) best ||= 1
    else best = Math.max(best, WORD.test(text[at + token.length] ?? '') ? 2 : 3)
  }
  return best
}

const NAME = [0, 2, 5, 7]
const SOURCE = [0, 1, 2.5, 3]
const DESC = [0, 0.4, 1.2, 1.5]

// Each token scores by the best field it lands in (name over source over
// description); every token has to land somewhere. The words in order in the
// name count extra. Installs break ties.
function score(e: AtlasEntry, tokens: string[], phrase: string): number {
  let total = 0
  for (const raw of tokens) {
    // "tickets" should also find "ticket": try the stem too.
    const t = raw.length > 4 && raw.endsWith('s') ? raw.slice(0, -1) : raw
    const level = (text: string) => (t === raw ? hit(text, raw) : Math.max(hit(text, raw), hit(text, t)))
    const name = e.nn === raw || e.nn === t ? 10 : NAME[level(e.nn)]
    const best = Math.max(name, SOURCE[level(e.s)], DESC[level(e.d)])
    if (!best) return 0
    total += best
  }
  if (e.nn === phrase) total += 20
  else if (e.nn.startsWith(phrase)) total += 6
  else if (tokens.length > 1 && e.nn.includes(phrase)) total += 4
  return total
}

export function search(entries: AtlasEntry[], query: string): AtlasEntry[] {
  const tokens = tokenize(query)
  // Shards arrive sorted (skills by installs), which is the no-query order.
  if (!tokens.length) return entries
  const phrase = tokens.join(' ')
  const hits: { e: AtlasEntry; s: number }[] = []
  for (const e of entries) {
    const s = score(e, tokens, phrase)
    if (s) hits.push({ e, s })
  }
  hits.sort((a, b) => b.s - a.s || b.e.installs - a.e.installs)
  return hits.map(h => h.e)
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
export const formatInstalls = (n: number) => compact.format(n)
