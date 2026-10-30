import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Copy, Download, Search } from 'lucide-react'
import { ATLAS_KINDS, formatInstalls, loadMeta, loadShard, search } from '../lib/atlas'
import type { AtlasEntry, AtlasKind, AtlasMeta } from '../lib/atlas'
import type { ItemType } from '../lib/catalog'
import { href, current, parse } from '../lib/router'
import { OwnerMark } from '../components/Brand'
import { Segmented, TypeIcon, copy } from '../components/ui'

type Shard = { status: 'loading' } | { status: 'ready'; entries: AtlasEntry[] } | { status: 'error'; message: string }

const PAGE = 60
const KIND_TYPE: Record<AtlasKind, ItemType> = { skills: 'skill', connectors: 'connector', plugins: 'plugin' }
const KIND_LABEL: Record<AtlasKind, string> = { skills: 'Skills', connectors: 'Connectors', plugins: 'Plugins' }
const WHERE: Record<AtlasKind, string> = {
  skills: 'Skills install from a system terminal.',
  connectors: 'Connectors install from a system terminal; a few ship as a Claude Desktop bundle.',
  plugins: 'Plugins install in Claude Code: paste each step as its own prompt.',
}

const plural = (kind: AtlasKind, n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? KIND_TYPE[kind] : kind}`

// The whole Mantle Atlas index (skills.sh, the MCP Registry, the official
// plugin marketplaces) searched in the tab. Shards load on the first visit.
export function Explore({ route }: { route: { q?: string; t?: AtlasKind } }) {
  const [text, setText] = useState(route.q ?? '')
  const [query, setQuery] = useState(route.q ?? '')
  const [kind, setKind] = useState<AtlasKind>(route.t ?? 'skills')
  const [limit, setLimit] = useState(PAGE)
  const [shards, setShards] = useState<Partial<Record<AtlasKind, Shard>>>({})
  const [meta, setMeta] = useState<AtlasMeta>()
  const input = useRef<HTMLInputElement>(null)

  // A real navigation (a shared link, back, the nav) resets the search;
  // typing only replaces the URL, which fires no popstate.
  useEffect(() => {
    setText(route.q ?? '')
    setQuery(route.q ?? '')
    setKind(route.t ?? 'skills')
  }, [route])

  useEffect(() => {
    const t = setTimeout(() => setQuery(text), 120)
    return () => clearTimeout(t)
  }, [text])

  useEffect(() => {
    const next = href({ page: 'explore', q: query, t: kind })
    if (parse(current()).page === 'explore' && current() !== next) history.replaceState(null, '', next)
    setLimit(PAGE)
  }, [query, kind])

  const load = useCallback((k: AtlasKind) => {
    setShards(s => (s[k]?.status === 'ready' ? s : { ...s, [k]: { status: 'loading' } }))
    return loadShard(k).then(
      entries => setShards(s => ({ ...s, [k]: { status: 'ready', entries } })),
      e => setShards(s => ({ ...s, [k]: { status: 'error', message: e instanceof Error ? e.message : String(e) } })),
    )
  }, [])

  // The type on screen first, the other two right after so their counts fill in.
  useEffect(() => {
    loadMeta().then(setMeta, () => {})
    load(kind).then(() => ATLAS_KINDS.forEach(k => k !== kind && load(k)))
    // Focus the search on desktop; on touch it would throw up the keyboard.
    if (matchMedia('(pointer: fine)').matches) input.current?.focus()
  }, [load]) // once: later type switches find the shards already loading

  // "/" jumps to the search from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      input.current?.focus()
      input.current?.select()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const out: Partial<Record<AtlasKind, AtlasEntry[]>> = {}
    for (const k of ATLAS_KINDS) {
      const s = shards[k]
      if (s?.status === 'ready') out[k] = search(s.entries, query)
    }
    return out
  }, [shards, query])

  const shard = shards[kind]
  const list = results[kind]
  const count = (k: AtlasKind) => results[k]?.length ?? (query.trim() ? undefined : meta?.counts[k])
  const total = meta && ATLAS_KINDS.reduce((n, k) => n + meta.counts[k], 0)
  const refreshed = meta?.refreshed && new Date(meta.refreshed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const elsewhere = ATLAS_KINDS.filter(k => k !== kind && results[k]?.length)

  return (
    <div className="page explore">
      <header className="page-head">
        <h1>
          Every skill, connector and plugin, <em>in one search.</em>
        </h1>
        <p className="lede">
          {total ? `${total.toLocaleString('en-US')} listings` : 'Listings'} from skills.sh, the official MCP Registry and the official plugin marketplaces, as indexed by Mantle Atlas
          {refreshed ? ` on ${refreshed}` : ''}. Descriptions are their authors' own and installs are skills.sh's count: read the source before you install.
        </p>
      </header>

      <div className="toolbar">
        <Segmented
          label="Filter by type"
          value={kind}
          onChange={setKind}
          options={ATLAS_KINDS.map(k => {
            const n = count(k)
            return {
              value: k,
              label: (
                <>
                  <TypeIcon type={KIND_TYPE[k]} size={14} /> {KIND_LABEL[k]} {n !== undefined && <span className="count">{n.toLocaleString('en-US')}</span>}
                </>
              ),
            }
          })}
        />
        <div className="toolbar-right">
          <label className="search explore-search">
            <Search size={16} aria-hidden />
            <input ref={input} type="search" placeholder="Search jira, postgres, code review…" value={text} onChange={e => setText(e.target.value)} aria-label="Search skills, connectors and plugins" />
            <kbd aria-hidden>/</kbd>
          </label>
        </div>
      </div>
      <div className="subfilters">
        <span className="muted small">{WHERE[kind]}</span>
        {list && (
          <span className="result-count" aria-live="polite">
            {plural(kind, list.length)}
          </span>
        )}
      </div>

      {(!shard || shard.status === 'loading') && <div className="panel skeleton">Loading the {kind} index…</div>}

      {shard?.status === 'error' && (
        <div className="panel explore-error">
          <span className="error-text">
            Couldn't load the {kind} index: {shard.message}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => load(kind)}>
            Retry
          </button>
        </div>
      )}

      {list && list.length === 0 && (
        <div className="empty">
          <p>
            No {kind} match “{query.trim()}”.
          </p>
          <div className="row justify-center">
            {elsewhere.map(k => (
              <button key={k} className="btn btn-secondary" onClick={() => setKind(k)}>
                See {plural(k, results[k]!.length)}
              </button>
            ))}
            <button className="btn btn-ghost" onClick={() => { setText(''); setQuery('') }}>
              Clear search
            </button>
          </div>
        </div>
      )}

      {list && list.length > 0 && (
        <>
          <ul className="atlas-list">
            {list.slice(0, limit).map(e => (
              <AtlasRow key={e.key} entry={e} />
            ))}
          </ul>
          {list.length > limit && (
            <div className="atlas-more">
              <span className="muted small">
                Showing {limit.toLocaleString('en-US')} of {list.length.toLocaleString('en-US')}
              </span>
              <button className="btn btn-secondary" onClick={() => setLimit(l => l + PAGE)}>
                Show {Math.min(PAGE, list.length - limit)} more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Index URLs come from third-party registries: only http(s) becomes a link.
function link(url: string): { href: string; label: string } | undefined {
  if (!/^https?:\/\//i.test(url)) return undefined
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return { href: url, label: host === 'github.com' ? 'GitHub' : host }
  } catch {
    return undefined
  }
}

function AtlasRow({ entry: e }: { entry: AtlasEntry }) {
  const multi = e.steps.length > 1
  const source = link(e.url)
  return (
    <li className="atlas-row">
      <OwnerMark login={e.owner} type={KIND_TYPE[e.kind]} size={18} px={64} />
      <div className="atlas-main">
        <div className="atlas-head">
          <h3>{e.name}</h3>
          <span className="atlas-source">{e.source}</span>
          {e.installs > 0 && (
            <span className="atlas-installs" title={`${e.installs.toLocaleString('en-US')} installs on skills.sh`}>
              <Download size={13} strokeWidth={2} aria-hidden /> {formatInstalls(e.installs)}
            </span>
          )}
        </div>
        <p className={`atlas-desc ${e.description ? '' : 'none'}`}>{e.description || 'No description in the index; the source has the details.'}</p>
        {e.steps.map((s, i) => (
          <div key={i} className="copyfield-row atlas-cmd">
            {multi && <span className="step-num">{i + 1}</span>}
            {s.where === 'bundle' && <span className="atlas-where">Desktop bundle</span>}
            <code>{s.command}</code>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => copy(s.command, multi ? `Step ${i + 1} copied` : s.where === 'bundle' ? 'Bundle link copied' : 'Install command copied')}
              aria-label={`Copy ${multi ? `step ${i + 1} of ` : ''}the install for ${e.name}`}
            >
              <Copy size={13} strokeWidth={2} aria-hidden /> Copy
            </button>
          </div>
        ))}
      </div>
      {source && (
        <a className="btn btn-ghost btn-sm atlas-link" href={source.href} target="_blank" rel="noreferrer" aria-label={`${e.name} on ${source.label}`}>
          {source.label} <ArrowUpRight size={14} strokeWidth={2} aria-hidden />
        </a>
      )}
    </li>
  )
}
