#!/usr/bin/env node
// mantle-doctor: a read-only check-up of a Claude Code setup.
//   node doctor.mjs [projectDir] [--json]
// Looks at what loads into every session (skill descriptions, CLAUDE.md files,
// MCP servers), MCP launch problems (Windows npx without `cmd /c`), secrets
// pasted into config, and risky or missing permission rules. It never writes.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const project = path.resolve(args.find(a => !a.startsWith('--')) ?? process.cwd())
const HOME = os.homedir()
const CLAUDE = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude')
const USER_JSON = process.env.CLAUDE_CONFIG_DIR ? path.join(CLAUDE, '.claude.json') : path.join(HOME, '.claude.json')
const WINDOWS = process.platform === 'win32'

// Rough token estimate: ~4 characters per token for English prose and code.
const tokens = text => Math.ceil(text.length / 4)

const findings = [] // { level: 'fix' | 'warn' | 'info', area, title, detail, fix? }
const add = (level, area, title, detail, fix) => findings.push({ level, area, title, detail, fix })

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return undefined
  }
}

function readJson(file) {
  const text = readText(file)
  if (text === undefined) return undefined
  try {
    return JSON.parse(text)
  } catch {
    add('fix', 'config', `${tilde(file)} is not valid JSON`, 'Claude Code will ignore or fail to read it.', 'Open it and fix the syntax (a trailing comma is the usual culprit).')
    return undefined
  }
}

function tilde(p) {
  const norm = p.replace(/\\/g, '/')
  const home = HOME.replace(/\\/g, '/')
  return norm.toLowerCase().startsWith(home.toLowerCase()) ? '~' + norm.slice(home.length) : norm
}

function subdirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.')).map(d => path.join(dir, d.name))
  } catch {
    return []
  }
}

// SKILL.md frontmatter: name and description, the part loaded into every session.
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!m) return {}
  const out = {}
  let key = null
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(line)
    if (kv) {
      key = kv[1]
      out[key] = kv[2].replace(/^["'>|-]\s*|["']$/g, '')
    } else if (key && /^\s+/.test(line)) out[key] += ' ' + line.trim()
  }
  return out
}

// ---- skills ------------------------------------------------------------------------

function skillDirs() {
  const roots = [
    { where: 'personal', dir: path.join(CLAUDE, 'skills') },
    { where: 'project', dir: path.join(project, '.claude', 'skills') },
  ]
  const installed = readJson(path.join(CLAUDE, 'plugins', 'installed_plugins.json'))
  const settings = readJson(path.join(CLAUDE, 'settings.json')) ?? {}
  const enabled = settings.enabledPlugins ?? {}
  for (const [id, entries] of Object.entries(installed?.plugins ?? {})) {
    for (const e of [].concat(entries)) {
      const local = e.scope === 'local' || e.scope === 'project'
      const here = !local || (e.projectPath && path.resolve(e.projectPath).toLowerCase() === project.toLowerCase())
      if (!here || enabled[id] === false) continue
      roots.push({ where: `plugin ${id}`, dir: path.join(e.installPath, 'skills') })
    }
  }
  const out = []
  for (const r of roots) for (const d of subdirs(r.dir)) if (fs.existsSync(path.join(d, 'SKILL.md'))) out.push({ where: r.where, dir: d })
  return out
}

function checkSkills() {
  const list = skillDirs().map(s => {
    const fm = frontmatter(readText(path.join(s.dir, 'SKILL.md')) ?? '')
    return { ...s, name: fm.name || path.basename(s.dir), description: fm.description ?? '' }
  })
  const total = list.reduce((n, s) => n + tokens(s.name + s.description) + 8, 0)
  const byName = new Map()
  for (const s of list) byName.set(s.name, [...(byName.get(s.name) ?? []), s])
  for (const [name, same] of byName) {
    if (same.length > 1) add('warn', 'skills', `Skill "${name}" is installed ${same.length} times`, same.map(s => `${s.where}: ${tilde(s.dir)}`).join('\n'), 'Keep one copy; duplicates compete to trigger and each costs context.')
  }
  for (const s of list) {
    if (!s.description) add('fix', 'skills', `Skill "${s.name}" has no description`, tilde(s.dir), 'Claude decides when to use a skill from its description; add one that says what it does and when to use it.')
    else if (s.description.length > 1024) add('warn', 'skills', `Skill "${s.name}" has a ${s.description.length}-character description`, `${tilde(s.dir)} (the Agent Skills spec caps it at 1024)`, 'Shorten it: it is loaded into every session.')
  }
  const heavy = [...list].sort((a, b) => b.description.length - a.description.length).slice(0, 5)
  add(total > 6000 ? 'warn' : 'info', 'context', `${list.length} skills load about ${total.toLocaleString()} tokens of descriptions into every session`, heavy.map(s => `${tokens(s.description).toString().padStart(5)} tok  ${s.name} (${s.where})`).join('\n'), total > 6000 ? 'Disable plugins you do not use here, or remove skills you never trigger.' : undefined)
  return list
}

// ---- CLAUDE.md -------------------------------------------------------------------

const ABSOLUTE = /\b(never|always|must not|must|do not|don't|forbidden)\b/i
const ENFORCEABLE = /\b(commit|push|run (the )?tests?|lint|format|prettier|eslint|delete|rm -rf|install|\.env|secrets?|force[- ]push|main branch|migrations?)\b/i
const VAGUE = /\b(be careful|clean code|best practices|high[- ]quality|as needed|when appropriate|properly|good code)\b/i

function memoryFiles() {
  const out = []
  const push = (file, scope) => fs.existsSync(file) && out.push({ file, scope })
  push(path.join(CLAUDE, 'CLAUDE.md'), 'user')
  let dir = project
  for (let i = 0; i < 8; i++) {
    push(path.join(dir, 'CLAUDE.md'), dir === project ? 'project' : 'parent folder')
    push(path.join(dir, '.claude', 'CLAUDE.md'), dir === project ? 'project' : 'parent folder')
    push(path.join(dir, 'CLAUDE.local.md'), 'local')
    const up = path.dirname(dir)
    if (up === dir || path.resolve(up) === path.resolve(HOME, '..')) break
    dir = up
  }
  return out.filter((f, i, all) => all.findIndex(g => path.resolve(g.file).toLowerCase() === path.resolve(f.file).toLowerCase()) === i)
}

function checkMemory() {
  let total = 0
  for (const { file, scope } of memoryFiles()) {
    const text = readText(file) ?? ''
    const lines = text.split(/\r?\n/)
    const base = path.dirname(file)
    let size = tokens(text)
    // @imports load too, recursively in Claude Code; count one level here.
    for (const m of text.matchAll(/(?:^|\s)@([~.\w/\\-]+\.\w+)/g)) {
      const target = m[1].startsWith('~') ? path.join(HOME, m[1].slice(1)) : path.resolve(base, m[1])
      const imported = readText(target)
      if (imported === undefined) add('fix', 'memory', `${tilde(file)} imports a missing file`, `@${m[1]}`, 'Fix the path or remove the import.')
      else size += tokens(imported)
    }
    total += size
    const where = `${tilde(file)} (${scope})`
    if (lines.length > 200 || size > 2500) add('warn', 'memory', `${where} is long: ${lines.length} lines, ~${size.toLocaleString()} tokens`, 'Long memory files load into every session and the rules in them get followed less reliably.', 'Keep it to what Claude cannot infer from the code; move reference material into skills or docs it reads on demand.')
    const seen = new Map()
    lines.forEach((raw, i) => {
      const line = raw.trim()
      if (line.length < 12 || line.startsWith('#') || line.startsWith('```')) return
      const key = line.toLowerCase().replace(/[^a-z0-9 ]/g, '')
      if (seen.has(key)) add('warn', 'memory', `Duplicate rule in ${tilde(file)}`, `line ${seen.get(key) + 1} and line ${i + 1}: ${line.slice(0, 90)}`, 'Keep one.')
      else seen.set(key, i)
      if (ABSOLUTE.test(line) && ENFORCEABLE.test(line)) add('info', 'memory', `Rule that a hook could enforce (${tilde(file)}:${i + 1})`, line.slice(0, 140), 'Prose rules can be forgotten; a PreToolUse hook or a permission deny rule cannot. Ask Claude to turn this into one.')
      if (VAGUE.test(line)) add('info', 'memory', `Vague rule (${tilde(file)}:${i + 1})`, line.slice(0, 140), 'Say what to do concretely (a command, a file, a pattern), or drop it.')
      for (const m of line.matchAll(/`((?:\.{0,2}\/)?[\w.-]+(?:\/[\w.-]+)+)`/g)) {
        const p = m[1]
        if (/^https?:|[*{}<>]/.test(p) || /\.(com|org|io|dev)\//.test(p)) continue
        if (!fs.existsSync(path.resolve(base, p)) && !fs.existsSync(path.resolve(project, p))) add('warn', 'memory', `Path in ${tilde(file)}:${i + 1} does not exist`, p, 'Stale paths send Claude looking in the wrong place; update or remove it.')
      }
    })
  }
  if (!memoryFiles().some(f => f.scope === 'project') && (fs.existsSync(path.join(project, 'package.json')) || fs.existsSync(path.join(project, '.git')))) {
    add('info', 'memory', 'This project has no CLAUDE.md', tilde(project), 'Run /init in Claude Code to draft one, then trim it to what Claude cannot work out from the code.')
  }
  return total
}

// ---- MCP servers -------------------------------------------------------------------

const SECRET_KEY = /(token|secret|password|passwd|api[_-]?key|auth|bearer|private)/i
const SECRET_VALUE = /^(sk-|ghp_|gho_|github_pat_|xox[abp]-|AKIA|AIza|eyJ)[\w.-]{10,}|^[A-Za-z0-9_\-]{32,}$/

function mcpSources() {
  const out = []
  const user = readJson(USER_JSON) ?? {}
  for (const [name, s] of Object.entries(user.mcpServers ?? {})) out.push({ name, s, where: 'user (~/.claude.json)' })
  const projects = user.projects ?? {}
  const key = Object.keys(projects).find(k => path.resolve(k).toLowerCase() === project.toLowerCase())
  for (const [name, s] of Object.entries((key && projects[key].mcpServers) ?? {})) out.push({ name, s, where: 'local (this project, ~/.claude.json)' })
  const shared = readJson(path.join(project, '.mcp.json'))
  for (const [name, s] of Object.entries(shared?.mcpServers ?? {})) out.push({ name, s, where: 'project (.mcp.json)' })
  return out
}

function checkMcp() {
  const list = mcpSources()
  for (const { name, s, where } of list) {
    const cmd = String(s.command ?? '')
    const argv = (s.args ?? []).map(String)
    if (WINDOWS && /^(npx|npm|pnpm|yarn|bunx)(\.cmd)?$/i.test(cmd)) {
      add('fix', 'mcp', `MCP server "${name}" runs ${cmd} directly on Windows`, `${where}: ${cmd} ${argv.join(' ')}`, `Native Windows can't spawn ${cmd} without a shell. Re-add it as: claude mcp add ${name} -- cmd /c ${cmd} ${argv.join(' ')}`)
    }
    const secrets = []
    for (const [k, v] of Object.entries(s.env ?? {})) if (SECRET_KEY.test(k) && v && !/^\$\{.+\}$/.test(String(v))) secrets.push(`env ${k}`)
    for (const [k, v] of Object.entries(s.headers ?? {})) if (SECRET_KEY.test(k) && v && !/\$\{.+\}/.test(String(v))) secrets.push(`header ${k}`)
    argv.forEach((a, i) => SECRET_VALUE.test(a) && secrets.push(`argument ${i + 1}`))
    if (secrets.length) {
      const shared = where.startsWith('project')
      add(shared ? 'fix' : 'warn', 'mcp', `MCP server "${name}" has a secret written into its config`, `${where}: ${secrets.join(', ')} (value not shown)`, shared ? '.mcp.json is usually committed: move the value to an environment variable and reference it as ${VAR}, then rotate the key if it was pushed.' : 'Prefer ${VAR} references to environment variables so the key is not stored in plain text.')
    }
  }
  if (list.length > 6) add('warn', 'context', `${list.length} MCP servers are configured for this project`, list.map(x => `${x.name} (${x.where})`).join('\n'), 'Every server adds its tool definitions to the context. Run /context in Claude Code to see their real size, and remove or scope the ones this project does not need (claude mcp remove <name>).')
  else add('info', 'mcp', `${list.length} MCP server${list.length === 1 ? '' : 's'} configured`, list.map(x => `${x.name} (${x.where})`).join('\n') || 'none', undefined)
  return list
}

// ---- permissions -------------------------------------------------------------------

function checkPermissions() {
  const files = [path.join(CLAUDE, 'settings.json'), path.join(project, '.claude', 'settings.json'), path.join(project, '.claude', 'settings.local.json')]
  const allow = []
  const deny = []
  for (const f of files) {
    const j = readJson(f)
    if (!j) continue
    const p = j.permissions ?? {}
    allow.push(...(p.allow ?? []).map(r => ({ r, f })))
    deny.push(...(p.deny ?? []).map(r => ({ r, f })))
    if (p.defaultMode === 'bypassPermissions') add('warn', 'permissions', `${tilde(f)} skips every permission prompt`, 'defaultMode: bypassPermissions', 'Prefer auto mode or a sandbox, plus a targeted allowlist.')
  }
  for (const { r, f } of allow) {
    if (/^Bash(\(\*\)|\(:\*\))?$/.test(r) || /^Bash\((rm|sudo|curl|wget|powershell|pwsh|bash|sh|node|python)\b/.test(r)) add('warn', 'permissions', `Broad allow rule: ${r}`, tilde(f), 'This lets Claude run arbitrary commands without asking. Narrow it to the exact commands you need.')
  }
  const env = ['.env', '.env.*', 'secrets/**'].filter(p => !deny.some(d => d.r.includes(p.replace('/**', ''))))
  if (fs.existsSync(path.join(project, '.env')) && env.includes('.env')) add('warn', 'permissions', 'This project has a .env file and no rule keeps Claude from reading it', tilde(path.join(project, '.env')), 'Add "deny": ["Read(./.env)", "Read(./.env.*)"] to .claude/settings.json.')
  // Read-only commands people approve over and over: a safe starter allowlist.
  const pkg = readJson(path.join(project, 'package.json'))
  const scripts = Object.keys(pkg?.scripts ?? {}).filter(s => /^(test|lint|typecheck|check|format:check|build)(:|$)/.test(s))
  const suggest = ['Bash(git status)', 'Bash(git diff:*)', 'Bash(git log:*)', ...scripts.map(s => `Bash(npm run ${s}:*)`)].filter(r => !allow.some(a => a.r === r))
  if (suggest.length) add('info', 'permissions', 'Starter allowlist to cut repeat prompts (read-only or local checks)', JSON.stringify({ permissions: { allow: suggest } }, null, 2), 'Add to .claude/settings.json if you approve these every time anyway.')
}

// ---- report ------------------------------------------------------------------------

const skills = checkSkills()
const memoryTokens = checkMemory()
const servers = checkMcp()
checkPermissions()

const order = { fix: 0, warn: 1, info: 2 }
findings.sort((a, b) => order[a.level] - order[b.level])
const summary = {
  project: tilde(project),
  skills: skills.length,
  skillTokens: skills.reduce((n, s) => n + tokens(s.name + s.description) + 8, 0),
  memoryTokens,
  mcpServers: servers.length,
  fix: findings.filter(f => f.level === 'fix').length,
  warn: findings.filter(f => f.level === 'warn').length,
}

if (asJson) {
  console.log(JSON.stringify({ summary, findings }, null, 2))
} else {
  const out = [`# Mantle doctor: ${summary.project}`, '']
  out.push(`Loads into every session: ~${(summary.skillTokens + summary.memoryTokens).toLocaleString()} tokens (skill descriptions ${summary.skillTokens.toLocaleString()}, CLAUDE.md ${summary.memoryTokens.toLocaleString()}), plus the tool definitions of ${summary.mcpServers} MCP server${summary.mcpServers === 1 ? '' : 's'} (see /context).`)
  out.push(`${summary.fix} to fix, ${summary.warn} to review.`, '')
  const label = { fix: 'FIX', warn: 'REVIEW', info: 'NOTE' }
  for (const f of findings) {
    out.push(`## ${label[f.level]} · ${f.title}`)
    if (f.detail) out.push('```', f.detail, '```')
    if (f.fix) out.push(`-> ${f.fix}`)
    out.push('')
  }
  out.push('_Read-only check. Token figures are estimates (~4 characters per token)._')
  console.log(out.join('\n'))
}
