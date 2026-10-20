#!/usr/bin/env node
// Rebuilds Mantle Atlas's searchable index from public sources, no API keys:
//   data/skills.tsv      every skill on skills.sh (sitemaps), install counts from
//                        its search API, descriptions from each skill's SKILL.md
//   data/connectors.tsv  every active server in the official MCP Registry
//   data/plugins.tsv     every plugin in Anthropic's official marketplace
// Usage: node scripts/refresh.mjs [--describe 3000] [--only skills|connectors|plugins]
// Node 18+ (global fetch). Polite: bounded concurrency, retries with backoff.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data')
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const ONLY = flag('only', '')
const DESCRIBE = Number(flag('describe', '3000'))
const UA = { 'user-agent': 'mantle-atlas-refresh (+https://github.com/AkshitTiwarii/mantle)' }

const sleep = ms => new Promise(r => setTimeout(r, ms))
async function get(url, { json = false, tries = 3 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: UA })
      if (res.status === 404) return null
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`)
      if (!res.ok) return null
      return json ? await res.json() : await res.text()
    } catch {
      await sleep(600 * (i + 1) ** 2)
    }
  }
  return null
}

async function pool(items, size, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i], i)
      }
    }),
  )
  return out
}

const clean = s => String(s ?? '').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
const tsv = (header, rows) => [header.join('\t'), ...rows.map(r => header.map(h => clean(r[h])).join('\t'))].join('\n') + '\n'
const log = (...m) => console.error('[atlas]', ...m)

// ---- skills ---------------------------------------------------------------------

// Job vocabulary for the search API: each query returns up to ~200 skills with installs.
const TERMS = `pdf docx excel xlsx pptx slides word spreadsheet csv markdown document report writing editing copywriting blog
seo marketing ads social twitter linkedin instagram youtube email newsletter sales crm outreach pitch proposal
design ui ux frontend css tailwind shadcn figma animation motion accessibility a11y responsive typography color brand logo icon
react nextjs vue svelte angular astro remix solid html javascript typescript node bun deno python django flask fastapi
go golang rust java kotlin swift ios android flutter expo react-native mobile electron tauri desktop
testing test tdd jest vitest playwright cypress e2e unit qa debugging debug bug fix error logging monitoring observability
git github gitlab commit pr review code-review refactor clean architecture patterns performance optimize profiling
security audit vulnerability auth oauth jwt encryption secrets compliance gdpr privacy pentest
database sql postgres mysql sqlite mongodb redis supabase prisma drizzle neon convex firebase orm migration
api rest graphql grpc openapi webhook backend server microservices serverless edge
deploy vercel netlify cloudflare aws azure gcp docker kubernetes terraform ci cd devops infra linux shell bash
data analysis analytics pandas numpy jupyter visualization chart dashboard bi etl pipeline scraping crawler
ai llm agent agents prompt rag embeddings mcp claude openai gemini langchain fine-tuning evals
research paper academic science math statistics finance accounting invoice tax legal contract hr recruiting
product pm roadmap spec prd planning project jira linear notion obsidian slack calendar meeting notes
image video audio music voice speech tts transcription 3d game unity godot blender
browser automation puppeteer selenium workflow n8n zapier productivity memory context skill skills find
education tutor learning language translation i18n chinese japanese ecommerce shopify stripe payments
health medical biology chemistry crypto blockchain web3 solidity`.split(/\s+/).filter(Boolean)

function parseFrontmatter(md) {
  const m = /^---\s*\n([\s\S]*?)\n---/.exec(md ?? '')
  if (!m) return {}
  const out = {}
  let key = null
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(line)
    if (kv) {
      key = kv[1]
      out[key] = kv[2].replace(/^["'>|-]\s*|["']$/g, '')
    } else if (key && /^\s+\S/.test(line)) {
      out[key] += ' ' + line.trim()
    }
  }
  return out
}

const decode = s => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

// The skill's page on skills.sh carries its description; GitHub is the fallback.
async function skillDescription(owner, repo, skill) {
  const page = await get(`https://www.skills.sh/${owner}/${repo}/${skill}`, { tries: 2 })
  const meta = /<meta name="description" content="([^"]*)"/.exec(page ?? '')
  if (meta && meta[1] && !/^Agent skills published by/.test(meta[1])) return { description: decode(meta[1]), path: 'skills.sh' }
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD`
  const paths = [`skills/${skill}/SKILL.md`, `${skill}/SKILL.md`, `.claude/skills/${skill}/SKILL.md`, `SKILL.md`, `skills/${skill}/skill.md`]
  for (const p of paths) {
    const md = await get(`${base}/${p}`, { tries: 1 })
    if (!md) continue
    const fm = parseFrontmatter(md)
    if (p === 'SKILL.md' && fm.name && fm.name !== skill) continue
    if (fm.description) return { description: fm.description, path: p }
  }
  return null
}

async function refreshSkills() {
  log('skills: reading skills.sh sitemaps')
  const index = await get('https://www.skills.sh/sitemap.xml')
  const maps = [...(index ?? '').matchAll(/<loc>([^<]*sitemap-skills[^<]*)<\/loc>/g)].map(m => m[1])
  const ids = new Set()
  for (const map of maps) {
    const xml = await get(map)
    for (const m of (xml ?? '').matchAll(/<loc>https:\/\/www\.skills\.sh\/([^<]+)<\/loc>/g)) {
      const parts = m[1].split('/')
      if (parts.length === 3) ids.add(m[1])
    }
  }
  log(`skills: ${ids.size} ids from ${maps.length} sitemaps`)

  log(`skills: install counts from ${TERMS.length} searches`)
  const installs = new Map()
  const names = new Map()
  await pool(TERMS, 6, async term => {
    const res = await get(`https://skills.sh/api/search?q=${encodeURIComponent(term)}&limit=200`, { json: true })
    for (const s of res?.skills ?? []) {
      installs.set(s.id, Math.max(installs.get(s.id) ?? 0, s.installs ?? 0))
      names.set(s.id, s.name)
      ids.add(s.id)
    }
  })
  log(`skills: ${installs.size} with install counts`)

  const rows = [...ids].map(id => {
    const [owner, repo, skill] = id.split('/')
    return {
      id,
      name: names.get(id) ?? skill,
      installs: installs.get(id) ?? '',
      description: '',
      install: `npx skills add ${owner}/${repo} --skill ${skill}`,
      url: `https://www.skills.sh/${id}`,
    }
  })
  rows.sort((a, b) => (Number(b.installs) || 0) - (Number(a.installs) || 0))

  const toDescribe = rows.slice(0, DESCRIBE)
  log(`skills: reading SKILL.md descriptions for the top ${toDescribe.length}`)
  let done = 0
  await pool(toDescribe, 10, async row => {
    const [owner, repo, skill] = row.id.split('/')
    const d = await skillDescription(owner, repo, skill)
    if (d) row.description = d.description
    if (++done % 250 === 0) log(`skills: ${done}/${toDescribe.length}`)
  })
  writeFileSync(join(DATA, 'skills.tsv'), tsv(['id', 'name', 'installs', 'description', 'install', 'url'], rows))
  log(`skills: wrote ${rows.length} rows (${rows.filter(r => r.description).length} described)`)
}

// ---- connectors -------------------------------------------------------------------

function connectorInstall(server, short) {
  const remote = (server.remotes ?? [])[0]
  if (remote?.url) {
    const transport = remote.type === 'sse' ? 'sse' : 'http'
    return `claude mcp add --transport ${transport} ${short} ${remote.url}`
  }
  const pkg = (server.packages ?? [])[0]
  if (pkg?.identifier) {
    const id = pkg.identifier
    const type = pkg.registryType ?? pkg.registry_type ?? pkg.registry_name
    if (type === 'npm') return `claude mcp add ${short} -- npx -y ${id}`
    if (type === 'pypi') return `claude mcp add ${short} -- uvx ${id}`
    if (type === 'oci' || type === 'docker') return `claude mcp add ${short} -- docker run -i --rm ${id}`
    return `${type ?? 'package'}: ${id}`
  }
  return ''
}

async function refreshConnectors() {
  log('connectors: paging the official MCP Registry')
  const latest = new Map()
  let cursor = ''
  for (let page = 0; page < 500; page++) {
    const url = `https://registry.modelcontextprotocol.io/v0/servers?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
    const res = await get(url, { json: true })
    if (!res) break
    for (const entry of res.servers ?? []) {
      const s = entry.server ?? entry
      const meta = entry._meta?.['io.modelcontextprotocol.registry/official'] ?? {}
      if (meta.status && meta.status !== 'active') continue
      const prev = latest.get(s.name)
      if (!prev || meta.isLatest) latest.set(s.name, s)
    }
    cursor = res.metadata?.nextCursor ?? res.metadata?.next_cursor ?? ''
    if (!cursor) break
    if (page % 10 === 9) log(`connectors: ${latest.size} so far`)
  }
  const rows = [...latest.values()].map(s => {
    const short = (s.name.split('/').pop() || s.name).replace(/[^\w-]/g, '-').slice(0, 40)
    return {
      name: s.name,
      title: s.title ?? '',
      description: s.description ?? '',
      install: connectorInstall(s, short),
      repo: s.repository?.url ?? s.websiteUrl ?? '',
      version: s.version ?? '',
    }
  })
  rows.sort((a, b) => a.name.localeCompare(b.name))
  writeFileSync(join(DATA, 'connectors.tsv'), tsv(['name', 'title', 'description', 'install', 'repo', 'version'], rows))
  log(`connectors: wrote ${rows.length} rows`)
}

// ---- plugins ----------------------------------------------------------------------

const MARKETPLACES = [
  { repo: 'anthropics/claude-plugins-official', name: 'claude-plugins-official' },
  { repo: 'anthropics/knowledge-work-plugins', name: 'knowledge-work-plugins' },
  { repo: 'AkshitTiwarii/mantle', name: 'mantle' },
]

async function refreshPlugins() {
  const rows = []
  for (const m of MARKETPLACES) {
    const json = await get(`https://raw.githubusercontent.com/${m.repo}/HEAD/.claude-plugin/marketplace.json`, { json: true })
    if (!json) {
      log(`plugins: no marketplace.json in ${m.repo}`)
      continue
    }
    const market = json.name ?? m.name
    for (const p of json.plugins ?? []) {
      rows.push({
        name: p.name,
        marketplace: market,
        description: p.description ?? '',
        category: p.category ?? (p.tags ?? []).join(' '),
        install: `/plugin marketplace add ${m.repo} then /plugin install ${p.name}@${market}`,
        source: typeof p.source === 'string' ? `https://github.com/${m.repo}` : p.source?.url ?? p.source?.repo ?? `https://github.com/${m.repo}`,
      })
    }
  }
  writeFileSync(join(DATA, 'plugins.tsv'), tsv(['name', 'marketplace', 'description', 'category', 'install', 'source'], rows))
  log(`plugins: wrote ${rows.length} rows`)
}

mkdirSync(DATA, { recursive: true })
const started = Date.now()
if (!ONLY || ONLY === 'plugins') await refreshPlugins()
if (!ONLY || ONLY === 'connectors') await refreshConnectors()
if (!ONLY || ONLY === 'skills') await refreshSkills()
writeFileSync(join(DATA, 'REFRESHED'), new Date().toISOString() + '\n')
log(`done in ${Math.round((Date.now() - started) / 1000)}s`)
