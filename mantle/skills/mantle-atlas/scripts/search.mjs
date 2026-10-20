#!/usr/bin/env node
// Search Mantle Atlas's index for skills, connectors and plugins that fit a job.
// Usage: node scripts/search.mjs "<what you need>" [--type all|skills|connectors|plugins] [--limit 10] [--live]
//   --live also asks skills.sh and the official MCP Registry right now (needs network).
// Prints Markdown: name, what it does, install command, source.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const query = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')).join(' ').trim()
const TYPE = flag('type', 'all')
const LIMIT = Number(flag('limit', '10'))
const LIVE = args.includes('--live')

if (!query) {
  console.log('Usage: node scripts/search.mjs "<what you need>" [--type all|skills|connectors|plugins] [--limit 10] [--live]')
  process.exit(1)
}

const STOP = new Set('a an the for to of and or in on with my me i want need how do is are can that this it use using tool tools skill skills connector connectors plugin plugins mcp server'.split(' '))
const tokens = query.toLowerCase().split(/[^a-z0-9.+#-]+/).filter(t => t && !STOP.has(t))

function load(file) {
  const path = join(DATA, file)
  if (!existsSync(path)) return []
  const [head, ...lines] = readFileSync(path, 'utf8').trimEnd().split('\n')
  const cols = head.split('\t')
  return lines.map(l => Object.fromEntries(l.split('\t').map((v, i) => [cols[i], v])))
}

// Each query word scores by the best field it hits, weighted by how rare the
// word is in the index (so "jira" outweighs "tickets"); covering more of the
// query's words outranks a strong match on one.
const wordRe = t => new RegExp(`(^|[^a-z0-9])${t.replace(/[.+#-]/g, '\$&')}`)
const stems = t => (t.length > 4 && t.endsWith('s') ? [t, t.slice(0, -1)] : [t])

function scorer(rows, fields) {
  const n = rows.length || 1
  const idf = new Map()
  for (const t of tokens) {
    const re = stems(t).map(wordRe)
    let df = 0
    for (const r of rows) if (fields.some(([f]) => re.some(x => x.test((r[f] ?? '').toLowerCase())))) df++
    idf.set(t, Math.log((n + 1) / (df + 1)))
  }
  return row => {
    let s = 0
    let covered = 0
    for (const t of tokens) {
      const re = stems(t).map(wordRe)
      let best = 0
      for (const [field, weight] of fields) {
        const v = (row[field] ?? '').toLowerCase()
        if (v && re.some(x => x.test(v))) best = Math.max(best, v === t ? weight * 2 : weight)
      }
      if (best) {
        s += best * idf.get(t)
        covered++
      }
    }
    return s === 0 ? 0 : s * (1 + covered) / (1 + tokens.length)
  }
}

function rank(rows, fields, boost = () => 0) {
  const score = scorer(rows, fields)
  return rows
    .map(r => ({ r, s: score(r) }))
    .filter(x => x.s > 0)
    .map(x => ({ ...x, s: x.s + boost(x.r) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, LIMIT)
    .map(x => x.r)
}

const out = []
const say = line => out.push(line)

if (TYPE === 'all' || TYPE === 'skills') {
  const hits = rank(load('skills.tsv'), [['name', 6], ['id', 3], ['description', 1]], r => Math.log10((Number(r.installs) || 0) + 1))
  say(`## Skills for "${query}"`)
  if (!hits.length) say('_No match in the local index._')
  for (const h of hits) {
    say(`- **${h.name}** (${h.id.split('/').slice(0, 2).join('/')}${h.installs ? `, ${Number(h.installs).toLocaleString('en-US')} installs` : ''}): ${h.description || '_no description indexed; read its SKILL.md_'}`)
    say(`  - Install: \`${h.install}\` · ${h.url}`)
  }
}

if (TYPE === 'all' || TYPE === 'connectors') {
  const hits = rank(load('connectors.tsv'), [['title', 6], ['name', 4], ['description', 1]], r => (r.install.includes('--transport') ? 0.3 : 0))
  say(`\n## Connectors (MCP) for "${query}"`)
  if (!hits.length) say('_No match in the local index._')
  for (const h of hits) {
    say(`- **${h.title || h.name}** (\`${h.name}\`): ${h.description}`)
    say(`  - Setup: \`${h.install || 'see source'}\`${h.repo ? ` · ${h.repo}` : ''}`)
  }
}

if (TYPE === 'all' || TYPE === 'plugins') {
  const hits = rank(load('plugins.tsv'), [['name', 6], ['category', 3], ['description', 1]])
  say(`\n## Plugins for "${query}"`)
  if (!hits.length) say('_No match in the local index._')
  for (const h of hits) {
    say(`- **${h.name}** (${h.marketplace}): ${h.description}`)
    say(`  - Install: \`${h.install}\``)
  }
}

if (LIVE) {
  const q = encodeURIComponent(query)
  try {
    const res = await fetch(`https://skills.sh/api/search?q=${q}&limit=${LIMIT}`).then(r => r.json())
    say(`\n## Live from skills.sh`)
    for (const s of res.skills ?? []) say(`- **${s.name}** (${s.source}, ${s.installs} installs): \`npx skills add ${s.source} --skill ${s.skillId}\``)
  } catch (e) {
    say(`\n_skills.sh live search failed: ${e.message}_`)
  }
  try {
    const res = await fetch(`https://registry.modelcontextprotocol.io/v0/servers?search=${q}&limit=${LIMIT}`).then(r => r.json())
    say(`\n## Live from the MCP Registry`)
    for (const e of res.servers ?? []) {
      const s = e.server ?? e
      say(`- **${s.title || s.name}** (\`${s.name}\`): ${s.description ?? ''}`)
    }
  } catch (e) {
    say(`\n_MCP Registry live search failed: ${e.message}_`)
  }
}

const refreshed = existsSync(join(DATA, 'REFRESHED')) ? readFileSync(join(DATA, 'REFRESHED'), 'utf8').trim() : 'never'
say(`\n_Index refreshed ${refreshed}. Run \`node scripts/refresh.mjs\` to update it._`)
console.log(out.join('\n'))
