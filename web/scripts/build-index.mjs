#!/usr/bin/env node
// Turns Mantle Atlas's TSV index into the JSON shards the Explore page loads:
// public/index/{skills,connectors,plugins}.json plus a small meta.json with
// the counts and refresh date. Each shard is an array of
// tuples, [name, source, installs, description, install, url, owner], so ~48k
// rows stay small. A skill's install and url are left empty when they follow
// the skills.sh pattern; the page rebuilds them (see src/lib/atlas.ts).
// Runs before every build; the data lives in the repo, so a fresh clone
// (Vercel included) has it.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA = join(HERE, '..', '..', 'mantle', 'skills', 'mantle-atlas', 'data')
const OUT = join(HERE, '..', 'public', 'index')
const MAX_DESC = 160

function fail(message) {
  console.error(`build-index: ${message}`)
  process.exit(1)
}

function load(file, columns) {
  const path = join(DATA, file)
  if (!existsSync(path)) fail(`missing ${relative(process.cwd(), path)}. The Atlas data ships in mantle/skills/mantle-atlas/data; run mantle-atlas/scripts/refresh.mjs to rebuild it.`)
  const [head, ...lines] = readFileSync(path, 'utf8').replace(/\r/g, '').trimEnd().split('\n')
  const cols = head.split('\t')
  const missing = columns.filter(c => !cols.includes(c))
  if (missing.length) fail(`${file} has no ${missing.join(', ')} column (header: ${cols.join(', ')})`)
  const rows = lines.map(l => Object.fromEntries(l.split('\t').map((v, i) => [cols[i], v.trim()])))
  if (!rows.length) fail(`${file} has no rows`)
  return rows
}

// Cut long descriptions at a word near the limit; CJK text has no spaces, so
// fall back to a hard cut.
function clip(text) {
  const s = text.replace(/\s+/g, ' ').trim()
  if (s.length <= MAX_DESC) return s
  const cut = s.slice(0, MAX_DESC - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > MAX_DESC * 0.7 ? cut.slice(0, space) : cut).replace(/[\s.,;:…-]+$/, '')}…`
}

const githubOwner = url => url.match(/^https?:\/\/github\.com\/([^/]+)/i)?.[1] ?? ''

const skills = load('skills.tsv', ['id', 'name', 'installs', 'description', 'install', 'url'])
  .filter(r => r.install)
  .map(r => {
    const source = r.id.split('/').slice(0, -1).join('/')
    const install = r.install === `npx skills add ${source} --skill ${r.name}` ? '' : r.install
    const url = r.url === `https://www.skills.sh/${r.id}` ? '' : r.url
    // skills.sh sources are GitHub repos unless they carry a domain.
    const owner = source.includes('.') ? '' : source.split('/')[0]
    return [r.name, source, Number(r.installs) || 0, clip(r.description), install, url, owner]
  })
  .sort((a, b) => b[2] - a[2])

const connectors = load('connectors.tsv', ['name', 'title', 'description', 'install', 'repo'])
  .filter(r => r.install)
  .map(r => {
    const owner = githubOwner(r.repo) || (r.name.match(/^io\.github\.([^/]+)\//)?.[1] ?? '')
    return [r.title || r.name.split('/').pop(), r.name, 0, clip(r.description), r.install, r.repo, owner]
  })
  .sort((a, b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }))

const plugins = load('plugins.tsv', ['name', 'marketplace', 'description', 'install', 'source'])
  .filter(r => r.install)
  .map(r => [r.name, r.marketplace, 0, clip(r.description), r.install, r.source.replace(/\.git$/, ''), githubOwner(r.source)])

mkdirSync(OUT, { recursive: true })
let total = 0
for (const [name, rows] of Object.entries({ skills, connectors, plugins })) {
  const path = join(OUT, `${name}.json`)
  const json = JSON.stringify(rows)
  writeFileSync(path, json)
  const gz = gzipSync(json).length
  total += gz
  console.log(`build-index: ${name.padEnd(10)} ${String(rows.length).padStart(6)} rows  ${kb(statSync(path).size)} (${kb(gz)} gzipped)`)
}
const refreshed = existsSync(join(DATA, 'REFRESHED')) ? readFileSync(join(DATA, 'REFRESHED'), 'utf8').trim() : ''
writeFileSync(join(OUT, 'meta.json'), JSON.stringify({ refreshed, counts: { skills: skills.length, connectors: connectors.length, plugins: plugins.length } }))
console.log(`build-index: ${skills.length + connectors.length + plugins.length} rows, ${kb(total)} gzipped, in ${relative(process.cwd(), OUT)}`)

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`.padStart(8)
}
