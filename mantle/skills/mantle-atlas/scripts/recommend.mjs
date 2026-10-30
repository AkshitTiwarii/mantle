#!/usr/bin/env node
// Recommend skills, connectors and plugins for one project, picked from the curated guides.
// Usage: node scripts/recommend.mjs [projectDir] [--json] [--depth 3] [--check]
//   Reads manifests (package.json, pyproject.toml, go.mod, Dockerfile, CI, deploy configs...)
//   up to --depth folders deep, maps what it finds to entries in references/*-by-job.md and
//   plugins-and-marketplaces.md, and prints Markdown (or JSON with --json).
//   --check only verifies that every mapped pick still exists in the references.
// Read-only: never writes files, never installs anything, never reads .env files.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REFS = join(dirname(fileURLToPath(import.meta.url)), '..', 'references')
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const positional = args.filter((a, i) => !a.startsWith('--') && !['--depth'].includes(args[i - 1]))
const ROOT = resolve(positional[0] ?? process.cwd())
const JSON_OUT = args.includes('--json')
const CHECK = args.includes('--check')
const DEPTH = Number(flag('depth', '3'))

// --- Curated references --------------------------------------------------------------------
// Entries are "### name — source" headings followed by "- **Field:** value" lines. The LSP
// plugins are a table, so rows of that table become entries too.

function parseRefs(file, kind) {
  const path = join(REFS, file)
  if (!existsSync(path)) return []
  const entries = []
  let section = ''
  let cur = null
  let lspTable = false
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (line.startsWith('## ')) { section = line.slice(3).trim(); cur = null; lspTable = false; continue }
    if (line.startsWith('### ')) {
      const h = line.slice(4).trim()
      const m = h.match(/^(.+?) — (.+)$/)
      cur = m ? { kind, file, section, name: m[1].trim(), source: m[2].trim(), fields: {} } : null
      if (cur) entries.push(cur)
      lspTable = /LSP/.test(h) && !m
      continue
    }
    const f = cur && line.match(/^- \*\*(.+?):\*\* ?(.*)$/)
    if (f) { cur.fields[f[1].toLowerCase()] = f[2].trim(); continue }
    const row = lspTable && line.match(/^\| ([a-z0-9-]+-lsp) \| (.+?) \| (.+?) \|$/)
    if (row) entries.push({
      kind, file, section, name: row[1], source: 'official (Anthropic)',
      fields: { what: `${row[2]} language server: live diagnostics and symbol navigation.`, 'use when': `You write ${row[2]}; install ${row[3]} first.`, install: `\`/plugin install ${row[1]}@claude-plugins-official\`` },
    })
  }
  return entries
}

const ENTRIES = {
  skills: parseRefs('skills-by-job.md', 'skill'),
  connectors: parseRefs('connectors-by-job.md', 'connector'),
  plugins: parseRefs('plugins-and-marketplaces.md', 'plugin'),
}

// "skills:name" or "skills:name@sourcePrefix" when a name appears twice.
function lookup(ref) {
  const [kind, rest] = ref.split(/:(.+)/)
  const [name, src] = rest.split('@')
  return (ENTRIES[kind] ?? []).find(e => e.name.toLowerCase() === name.toLowerCase() && (!src || e.source.toLowerCase().startsWith(src.toLowerCase())))
}

// --- What each technology maps to ----------------------------------------------------------
// npm / py: package names (a trailing "/" matches a scope). files: names found while walking.

const TECH = [
  // Frameworks & UI
  { id: 'next', label: 'Next.js', group: 'Frameworks & UI', npm: ['next'], picks: ['skills:next-dev-loop', 'skills:vercel-react-best-practices'] },
  { id: 'react', label: 'React', group: 'Frameworks & UI', npm: ['react'], picks: ['skills:vercel-react-best-practices', 'skills:vercel-composition-patterns'] },
  { id: 'vue', label: 'Vue', group: 'Frameworks & UI', npm: ['vue', 'nuxt'], picks: ['skills:vue-best-practices'] },
  { id: 'svelte', label: 'Svelte', group: 'Frameworks & UI', npm: ['svelte', '@sveltejs/kit'], picks: ['skills:svelte-code-writer'] },
  { id: 'angular', label: 'Angular', group: 'Frameworks & UI', npm: ['@angular/core'], picks: ['skills:angular-developer'] },
  { id: 'react-native', label: 'React Native', group: 'Frameworks & UI', npm: ['react-native'], picks: ['skills:vercel-react-native-skills', 'skills:react-native-best-practices'] },
  { id: 'expo', label: 'Expo', group: 'Frameworks & UI', npm: ['expo'], picks: ['skills:expo-native-ui', 'skills:eas-app-stores'] },
  { id: 'tailwind', label: 'Tailwind CSS', group: 'Frameworks & UI', npm: ['tailwindcss', '@tailwindcss/'], picks: ['skills:frontend-design@anthropics', 'skills:web-design-guidelines'] },
  { id: 'shadcn', label: 'shadcn/ui', group: 'Frameworks & UI', files: ['components.json'], picks: ['skills:shadcn'] },
  { id: 'motion', label: 'Motion', group: 'Frameworks & UI', npm: ['motion', 'framer-motion'], picks: ['skills:emil-design-eng'] },
  { id: 'gsap', label: 'GSAP', group: 'Frameworks & UI', npm: ['gsap', '@gsap/'], picks: ['skills:gsap skills'] },
  { id: 'lenis', label: 'Lenis', group: 'Frameworks & UI', npm: ['lenis', '@studio-freight/lenis'], picks: ['skills:cinematic-gsap-lenis-motion-system'] },
  { id: 'three', label: 'three.js', group: 'Frameworks & UI', npm: ['three', '@react-three/'], picks: [], hint: 'three.js' },
  { id: 'remotion', label: 'Remotion', group: 'Frameworks & UI', npm: ['remotion', '@remotion/'], picks: ['skills:remotion-best-practices'] },
  // Data & backend
  { id: 'prisma', label: 'Prisma', group: 'Data & backend', npm: ['prisma', '@prisma/client'], picks: ['skills:prisma-client-api'] },
  { id: 'drizzle', label: 'Drizzle ORM', group: 'Data & backend', npm: ['drizzle-orm'], picks: [], hint: 'drizzle' },
  { id: 'postgres', label: 'Postgres', group: 'Data & backend', npm: ['pg', 'postgres', '@vercel/postgres'], py: ['psycopg', 'psycopg2', 'psycopg2-binary', 'asyncpg'], picks: ['skills:postgresql-table-design', 'connectors:Postgres MCP Pro'] },
  { id: 'neon', label: 'Neon', group: 'Data & backend', npm: ['@neondatabase/serverless'], picks: ['skills:neon-postgres', 'connectors:Neon'] },
  { id: 'supabase', label: 'Supabase', group: 'Data & backend', npm: ['@supabase/supabase-js', '@supabase/ssr'], py: ['supabase'], picks: ['skills:supabase', 'skills:supabase-postgres-best-practices', 'connectors:Supabase'] },
  { id: 'convex', label: 'Convex', group: 'Data & backend', npm: ['convex'], picks: ['skills:convex', 'connectors:Convex'] },
  { id: 'mongodb', label: 'MongoDB', group: 'Data & backend', npm: ['mongodb', 'mongoose'], py: ['pymongo', 'motor'], picks: ['skills:mongodb-query-optimizer', 'connectors:MongoDB'] },
  { id: 'redis', label: 'Redis', group: 'Data & backend', npm: ['redis', 'ioredis', '@upstash/redis'], py: ['redis'], picks: ['connectors:Redis'] },
  { id: 'firebase', label: 'Firebase', group: 'Data & backend', npm: ['firebase', 'firebase-admin'], py: ['firebase-admin'], picks: ['skills:firebase-basics', 'skills:firebase-firestore', 'connectors:Firebase'] },
  { id: 'django', label: 'Django', group: 'Data & backend', py: ['django'], picks: [], hint: 'django' },
  { id: 'fastapi', label: 'FastAPI', group: 'Data & backend', py: ['fastapi'], picks: [], hint: 'fastapi' },
  { id: 'flask', label: 'Flask', group: 'Data & backend', py: ['flask'], picks: [], hint: 'flask' },
  { id: 'rails', label: 'Rails', group: 'Data & backend', gem: ['rails'], picks: [], hint: 'rails' },
  { id: 'pandas', label: 'pandas / notebooks', group: 'Data & backend', py: ['pandas', 'polars', 'numpy', 'jupyter', 'jupyterlab', 'matplotlib'], files: ['*.ipynb'], picks: ['skills:jupyter-notebook', 'skills:data-visualization'] },
  { id: 'pytorch', label: 'PyTorch / Hugging Face', group: 'Data & backend', py: ['torch', 'pytorch', 'transformers', 'datasets', 'diffusers'], picks: ['skills:hf-cli', 'connectors:Hugging Face'] },
  // Payments, auth & monitoring
  { id: 'stripe', label: 'Stripe', group: 'Payments, auth & monitoring', npm: ['stripe', '@stripe/stripe-js', '@stripe/react-stripe-js'], py: ['stripe'], picks: ['plugins:stripe', 'skills:stripe-best-practices', 'connectors:Stripe'] },
  { id: 'better-auth', label: 'Better Auth', group: 'Payments, auth & monitoring', npm: ['better-auth'], picks: ['skills:better-auth-best-practices'] },
  { id: 'sentry', label: 'Sentry', group: 'Payments, auth & monitoring', npm: ['@sentry/'], py: ['sentry-sdk'], picks: ['plugins:sentry', 'connectors:Sentry'] },
  { id: 'posthog', label: 'PostHog', group: 'Payments, auth & monitoring', npm: ['posthog-js', 'posthog-node'], py: ['posthog'], picks: ['connectors:PostHog'] },
  // AI & agents
  { id: 'ai-sdk', label: 'Vercel AI SDK', group: 'AI & agents', npm: ['ai', '@ai-sdk/'], picks: ['skills:ai-sdk'] },
  { id: 'anthropic', label: 'Claude API', group: 'AI & agents', npm: ['@anthropic-ai/sdk', '@anthropic-ai/claude-agent-sdk'], py: ['anthropic', 'claude-agent-sdk'], picks: ['skills:claude-api'] },
  { id: 'mcp', label: 'MCP SDK', group: 'AI & agents', npm: ['@modelcontextprotocol/sdk', '@modelcontextprotocol/server'], py: ['mcp', 'fastmcp'], picks: ['skills:mcp-builder'] },
  { id: 'langchain', label: 'LangChain / LangGraph', group: 'AI & agents', npm: ['langchain', '@langchain/'], py: ['langchain', 'langgraph'], picks: ['skills:langgraph-fundamentals'] },
  // Testing (any runner also adds the generic testing picks below)
  { id: 'playwright', label: 'Playwright', group: 'Testing', test: true, npm: ['@playwright/test', 'playwright'], py: ['playwright', 'pytest-playwright'], files: ['playwright.config.*'], picks: ['skills:playwright-best-practices', 'connectors:Playwright MCP'] },
  { id: 'vitest', label: 'Vitest', group: 'Testing', test: true, npm: ['vitest'], picks: ['skills:vitest'] },
  { id: 'jest', label: 'Jest', group: 'Testing', test: true, npm: ['jest'], picks: [] },
  { id: 'cypress', label: 'Cypress', group: 'Testing', test: true, npm: ['cypress'], picks: [] },
  { id: 'mocha', label: 'Mocha', group: 'Testing', test: true, npm: ['mocha'], picks: [] },
  { id: 'pytest', label: 'pytest', group: 'Testing', test: true, py: ['pytest'], picks: [] },
  // Deploy & CI
  { id: 'docker', label: 'Docker', group: 'Deploy & CI', files: ['Dockerfile', '*.Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'], picks: ['skills:multi-stage-dockerfile'] },
  { id: 'github-actions', label: 'GitHub Actions', group: 'Deploy & CI', files: ['.github/workflows'], picks: ['skills:gh-fix-ci', 'plugins:github'] },
  { id: 'github', label: 'GitHub remote', group: 'Deploy & CI', files: ['.git/config:github.com'], picks: ['connectors:GitHub'] },
  { id: 'vercel', label: 'Vercel', group: 'Deploy & CI', files: ['vercel.json', '.vercel'], picks: ['plugins:vercel', 'skills:deploy-to-vercel'] },
  { id: 'netlify', label: 'Netlify', group: 'Deploy & CI', files: ['netlify.toml'], picks: ['skills:netlify-deploy', 'connectors:Netlify'] },
  { id: 'cloudflare', label: 'Cloudflare Workers', group: 'Deploy & CI', files: ['wrangler.toml', 'wrangler.json', 'wrangler.jsonc'], npm: ['wrangler'], picks: ['plugins:cloudflare', 'skills:workers-best-practices'] },
  { id: 'render', label: 'Render', group: 'Deploy & CI', files: ['render.yaml'], picks: ['connectors:Render'] },
  { id: 'railway', label: 'Railway', group: 'Deploy & CI', files: ['railway.json', 'railway.toml'], picks: ['connectors:Railway'] },
  { id: 'fly', label: 'Fly.io', group: 'Deploy & CI', files: ['fly.toml'], picks: ['connectors:Fly.io'] },
  { id: 'terraform', label: 'Terraform', group: 'Deploy & CI', files: ['*.tf'], picks: ['skills:terraform-style-guide', 'connectors:Terraform'] },
  // Languages
  { id: 'typescript', label: 'TypeScript', group: 'Languages', npm: ['typescript'], files: ['tsconfig.json'], picks: ['plugins:typescript-lsp'] },
  { id: 'python', label: 'Python', group: 'Languages', files: ['pyproject.toml', 'requirements.txt', 'Pipfile', 'setup.py'], picks: ['plugins:pyright-lsp', 'skills:security-best-practices@openai'] },
  { id: 'go', label: 'Go', group: 'Languages', files: ['go.mod'], picks: ['plugins:gopls-lsp', 'skills:security-best-practices@openai'] },
  { id: 'rust', label: 'Rust', group: 'Languages', files: ['Cargo.toml'], picks: ['plugins:rust-analyzer-lsp'] },
  { id: 'ruby', label: 'Ruby', group: 'Languages', files: ['Gemfile'], picks: ['plugins:ruby-lsp'] },
]
const DOCS = { id: 'docs', label: 'library docs', group: 'Docs freshness', note: 'Pick one: the plugin wraps the same hosted server.', picks: ['connectors:Context7', 'plugins:context7'] }
const TESTING = { id: 'testing', label: 'a test runner', group: 'Testing', picks: ['skills:tdd', 'skills:verification-before-completion'] }

if (CHECK) {
  const missing = [...TECH, DOCS, TESTING].flatMap(t => t.picks.filter(p => !lookup(p)).map(p => `${t.id}: ${p}`))
  console.log(missing.length ? `Missing from references:\n${missing.join('\n')}` : `All ${[...TECH, DOCS, TESTING].reduce((n, t) => n + t.picks.length, 0)} mapped picks found in references.`)
  process.exit(missing.length ? 1 : 0)
}

if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) {
  console.log(`Not a folder: ${ROOT}\nUsage: node scripts/recommend.mjs [projectDir] [--json] [--depth 3]`)
  process.exit(1)
}

// --- Scan the project ----------------------------------------------------------------------

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.turbo', '.vercel', '.output', '.venv', 'venv', 'env', '__pycache__', 'target', 'vendor', 'coverage', '.cache', 'backups', 'worktrees'])
const rel = p => relative(ROOT, p).replace(/\\/g, '/') || '.'
const read = p => { try { return readFileSync(p, 'utf8') } catch { return '' } }
const readJson = p => { try { return JSON.parse(read(p)) } catch { return null } }
const glob = (pat, name) => (pat.includes('*') ? new RegExp(`^${pat.replace(/[.+]/g, '\\$&').replace(/\*/g, '.*')}$`).test(name) : pat === name)

const files = [] // every file name within DEPTH, as relative paths
const dirs = [ROOT]
;(function walk(dir, depth) {
  let list
  try { list = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const d of list) {
    if (d.isDirectory()) {
      if (SKIP.has(d.name) || (d.name.startsWith('.') && d.name !== '.github') || depth >= DEPTH) continue
      dirs.push(join(dir, d.name))
      walk(join(dir, d.name), depth + 1)
    } else if (!d.name.startsWith('.env')) files.push(join(dir, d.name))
  }
})(ROOT, 0)

const found = new Map() // tech id -> Set of evidence strings
const hit = (id, why) => (found.get(id) ?? found.set(id, new Set()).get(id)).add(why)
const npmMatch = (pats, dep) => pats.some(p => (p.endsWith('/') ? dep.startsWith(p) : dep === p))

let libDeps = 0
for (const f of files) {
  const name = basename(f)
  if (name === 'package.json') {
    const pkg = readJson(f)
    if (!pkg) continue
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies })
    libDeps += deps.length
    for (const t of TECH) for (const d of deps) if (t.npm && npmMatch(t.npm, d)) hit(t.id, `${rel(f)} (${d})`)
  }
  if (name === 'pyproject.toml' || /^requirements.*\.txt$/.test(name) || name === 'Pipfile') {
    const text = read(f).toLowerCase()
    const names = new Set([...text.matchAll(/(?:^|["'\s,[])([a-z0-9][a-z0-9_.-]*)\s*(?:\[[^\]]*\])?\s*(?=[<>=~!;,"'\]\s]|$)/gm)].map(m => m[1].replace(/_/g, '-')))
    libDeps += names.size
    for (const t of TECH) for (const p of t.py ?? []) if (names.has(p)) hit(t.id, `${rel(f)} (${p})`)
  }
  if (name === 'Gemfile') for (const t of TECH) for (const g of t.gem ?? []) if (new RegExp(`gem ['"]${g}['"]`).test(read(f))) hit(t.id, `${rel(f)} (${g})`)
  if (name === 'go.mod' || name === 'Cargo.toml' || name === 'Gemfile') libDeps++
  for (const t of TECH) for (const p of t.files ?? []) if (!p.includes('/') && glob(p, name)) hit(t.id, rel(f))
}
for (const d of dirs) if (existsSync(join(d, '.github', 'workflows'))) hit('github-actions', rel(join(d, '.github', 'workflows')))
if (existsSync(join(ROOT, '.vercel'))) hit('vercel', '.vercel/')
if (/github\.com/.test(read(join(ROOT, '.git', 'config')))) hit('github', '.git/config (github.com remote)')

const detected = TECH.filter(t => found.has(t.id))
const groups = [...detected]
if (libDeps > 0) groups.push(DOCS)
if (detected.some(t => t.test)) groups.push(TESTING)

// --- What's already set up -----------------------------------------------------------------

const norm = s => s.toLowerCase().replace(/\b(mcp|server|skills?|plugin)\b/g, '').replace(/[^a-z0-9]/g, '')
const listSkills = p => { try { return readdirSync(p).filter(n => !n.startsWith('.') && existsSync(join(p, n, 'SKILL.md'))) } catch { return [] } }
const setUp = [] // { kind, name, scope, where }
const add = (kind, name, scope, where) => { if (!setUp.some(s => s.kind === kind && s.name === name && s.scope === scope)) setUp.push({ kind, name, scope, where }) }

for (const s of listSkills(join(ROOT, '.claude', 'skills'))) add('skill', s, 'project', '.claude/skills/')
for (const s of listSkills(join(ROOT, '.agents', 'skills'))) add('skill', s, 'project', '.agents/skills/')
for (const s of Object.keys(readJson(join(ROOT, 'skills-lock.json'))?.skills ?? {})) add('skill', s, 'project', 'skills-lock.json')
for (const s of Object.keys(readJson(join(ROOT, '.mcp.json'))?.mcpServers ?? {})) add('connector', s, 'project', '.mcp.json')
for (const f of ['settings.json', 'settings.local.json']) for (const p of Object.keys(readJson(join(ROOT, '.claude', f))?.enabledPlugins ?? {})) add('plugin', p, 'project', `.claude/${f}`)
for (const f of ['CLAUDE.md', 'AGENTS.md', '.claude/CLAUDE.md']) if (existsSync(join(ROOT, f))) add('memory', f, 'project', f)

const HOME = join(homedir(), '.claude')
for (const s of listSkills(join(HOME, 'skills'))) add('skill', s, 'user', '~/.claude/skills/')
for (const p of Object.keys(readJson(join(HOME, 'settings.json'))?.enabledPlugins ?? {})) add('plugin', p, 'user', '~/.claude/settings.json')
const installed = readJson(join(HOME, 'plugins', 'installed_plugins.json'))?.plugins ?? {}
for (const [p, recs] of Object.entries(installed)) for (const r of [].concat(recs)) {
  if (r.scope === 'user') add('plugin', p, 'user', '~/.claude/plugins')
  else if (r.projectPath && resolve(r.projectPath).toLowerCase() === ROOT.toLowerCase()) add('plugin', p, r.scope ?? 'local', '~/.claude/plugins')
}
const claudeJson = readJson(join(homedir(), '.claude.json')) ?? {} // only server names are read out
for (const s of Object.keys(claudeJson.mcpServers ?? {})) add('connector', s, 'user', '~/.claude.json')
const projKey = Object.keys(claudeJson.projects ?? {}).find(k => resolve(k).toLowerCase() === ROOT.toLowerCase())
for (const s of Object.keys(claudeJson.projects?.[projKey]?.mcpServers ?? {})) add('connector', s, 'local', '~/.claude.json')

function installedAs(e) {
  const want = [norm(e.name), norm(e.name.split(/[ /]/)[0])]
  const kind = e.kind === 'skill' ? ['skill', 'plugin'] : e.kind === 'plugin' ? ['plugin'] : ['connector']
  return setUp.find(s => kind.includes(s.kind) && want.includes(norm(s.name.split('@')[0])))
}

// --- Build picks ---------------------------------------------------------------------------

const firstCode = s => s?.match(/`([^`]+)`/)?.[1] ?? ''
const firstSentence = s => (s ?? '').replace(/\s+/g, ' ').match(/^(.+?[.!?])(\s|$)/)?.[1] ?? s ?? ''
function where(cmd) {
  if (cmd.startsWith('/')) return 'Claude Code prompt'
  if (cmd.startsWith('npx skills') || cmd.startsWith('claude ')) return 'system terminal, in the project folder'
  return 'see the reference entry'
}

const picks = new Map() // key -> pick
const already = new Map()
for (const t of groups) for (const ref of t.picks) {
  const e = lookup(ref)
  if (!e) continue
  const key = `${e.kind}:${e.name}:${e.source}`
  const have = installedAs(e)
  // A "pick one" group is covered once any of its picks is installed.
  if (!have && t.note && t.picks.some(p => lookup(p) && installedAs(lookup(p)))) continue
  const because = t.id === 'docs' ? 'library dependencies' : t.id === 'testing' ? 'test runner' : t.label
  const target = have ? already : picks
  if (target.has(key)) { const p = target.get(key); if (!p.because.includes(because)) p.because.push(because); continue }
  const raw = e.fields.install ?? e.fields['setup (claude code)'] ?? ''
  const cmd = firstCode(raw)
  const notes = []
  if (/YOUR_/.test(raw)) notes.push('replace the YOUR_* placeholder with your own key')
  if (/OAuth|\/mcp\b/.test(raw)) notes.push('sign in with /mcp after adding')
  if (process.platform === 'win32' && / -- npx /.test(cmd)) notes.push('on native Windows wrap as `-- cmd /c npx ...`')
  target.set(key, {
    group: t.group, kind: e.kind, name: e.name, source: e.source, because: [because],
    why: firstSentence(/\b(those|these)\b/.test(e.fields['use when'] ?? '') ? e.fields.what : e.fields['use when'] || e.fields.what),
    install: cmd, installFull: raw.replace(/`/g, ''), where: where(cmd), notes,
    reference: `references/${e.file}`, ...(have ? { installedAs: have } : {}),
  })
}

const noPick = detected.filter(t => !t.picks.length && !t.test).map(t => ({ tech: t.label, hint: `node scripts/search.mjs "${t.hint ?? t.id}"` }))
const memory = setUp.filter(s => s.kind === 'memory' && s.scope === 'project')

const result = {
  project: ROOT,
  scannedDepth: DEPTH,
  detected: detected.map(t => ({ id: t.id, label: t.label, evidence: [...found.get(t.id)].slice(0, 5) })),
  picks: [...picks.values()],
  alreadySetUp: {
    matchingPicks: [...already.values()].map(p => ({ name: p.name, kind: p.kind, because: p.because, installedAs: p.installedAs })),
    project: setUp.filter(s => s.scope !== 'user'),
    user: setUp.filter(s => s.scope === 'user'),
  },
  noCuratedPick: noPick,
  notes: memory.length ? [] : ['No CLAUDE.md or AGENTS.md: run `/init` in Claude Code to create one.'],
}

if (JSON_OUT) {
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

// --- Markdown report -----------------------------------------------------------------------

const out = []
const say = l => out.push(l)
say(`# Recommendations for ${basename(ROOT)}`)
say('')
say(detected.length ? `**Detected:** ${detected.map(t => t.label).join(', ')}` : '**Detected:** nothing recognizable (no package.json, pyproject.toml, go.mod, Cargo.toml, Gemfile, Dockerfile or deploy config within the scan depth).')
for (const t of detected) say(`- ${t.label}: ${[...found.get(t.id)].slice(0, 3).join(', ')}${found.get(t.id).size > 3 ? `, +${found.get(t.id).size - 3} more` : ''}`)

const byGroup = new Map()
for (const p of picks.values()) (byGroup.get(p.group) ?? byGroup.set(p.group, []).get(p.group)).push(p)
for (const [g, list] of byGroup) {
  say(`\n## ${g}`)
  const note = groups.find(t => t.group === g && t.note)?.note
  if (note && list.length > 1) say(`_${note}_`)
  for (const p of list) {
    say(`- **${p.name}** (${p.kind}, ${p.source}) for ${p.because.join(', ')}: ${p.why}`)
    say(`  - Install: \`${p.install || p.installFull}\` · run in: ${p.where}${p.notes.length ? ` · ${p.notes.join('; ')}` : ''}`)
  }
}
if (!picks.size) say('\n_No curated picks for this stack._')

if (noPick.length) {
  say('\n## No curated pick yet')
  for (const n of noPick) say(`- ${n.tech}: search the full index with \`${n.hint}\``)
}

say('\n## Already set up')
if (already.size) for (const p of already.values()) say(`- **${p.name}** (${p.kind}) for ${p.because.join(', ')}: installed as \`${p.installedAs.name}\` (${p.installedAs.scope}, ${p.installedAs.where})`)
const proj = setUp.filter(s => s.scope !== 'user')
const kinds = [['memory', 'Memory files'], ['skill', 'Skills'], ['connector', 'MCP servers'], ['plugin', 'Plugins']]
for (const [k, label] of kinds) {
  const p = proj.filter(s => s.kind === k).map(s => s.name)
  const u = setUp.filter(s => s.scope === 'user' && s.kind === k).map(s => s.name)
  if (p.length) say(`- ${label} in this project: ${[...new Set(p)].join(', ')}`)
  if (u.length) say(`- ${label} for all your projects: ${[...new Set(u)].join(', ')}`)
}
if (!setUp.length) say('- Nothing found (no .claude/skills, .mcp.json, CLAUDE.md or user-level installs).')
for (const n of result.notes) say(`\n_${n}_`)

say('\n_Picks come from the curated guides in references/. Read an entry before installing; third-party skills and servers run with your permissions. Nothing was installed or written._')
console.log(out.join('\n'))
