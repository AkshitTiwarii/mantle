#!/usr/bin/env node
// Trust check for a third-party skill before installing it: static, read-only, heuristic.
// Usage: node scripts/vet.mjs <owner/repo | github URL | skills.sh URL | local path> [--skill name] [--json]
//   GitHub: lists the repo with the public tree API (no token, 60 requests/hour) and reads
//   SKILL.md, other .md, script and hook/MCP config files under the skill folder from
//   raw.githubusercontent.com, about 1.5 MB at most. Nothing fetched is ever executed.
// Prints a verdict (low / review / high risk) with file:line evidence. A clean result is not
// a guarantee: code can download more later, and MCP servers do their work server-side.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--skill')
const SKILL = flag('skill')
const JSON_OUT = args.includes('--json')
const CAP = 1.5 * 1024 * 1024
const MAX_FILE = 512 * 1024

if (!target) {
  console.log('Usage: node scripts/vet.mjs <owner/repo | github URL | local path> [--skill name] [--json]')
  process.exit(1)
}

// --- Which files to read -------------------------------------------------------------------

const SCRIPT = new Set(['.sh', '.bash', '.zsh', '.ps1', '.psm1', '.bat', '.cmd', '.py', '.js', '.mjs', '.cjs', '.ts', '.rb', '.html', '.htm'])
const CONFIG = new Set(['hooks.json', '.mcp.json', 'settings.json', 'settings.local.json', 'plugin.json', 'package.json'])
const BINARY = new Set(['.exe', '.dll', '.so', '.dylib', '.bin', '.jar', '.pyc', '.wasm', '.node', '.msi', '.dmg', '.app', '.scr', '.com'])
const kindOf = p => {
  const ext = extname(p).toLowerCase()
  if (basename(p).toLowerCase() === 'skill.md') return 'skill'
  if (ext === '.md') return 'md'
  if (SCRIPT.has(ext)) return 'script'
  if (CONFIG.has(basename(p))) return 'config'
  if (BINARY.has(ext)) return 'binary'
  return null
}
const PRIORITY = { skill: 0, config: 1, script: 2, md: 3 }

// Pick the skill folder(s): --skill by folder name (then by frontmatter name), else every
// folder holding a SKILL.md, else the whole tree.
async function choose(all, readText) {
  const skillDirs = all.filter(f => /(^|\/)SKILL\.md$/i.test(f.path)).map(f => dirname(f.path).replace(/^\.$/, ''))
  let roots = skillDirs
  const notes = []
  if (SKILL) {
    roots = skillDirs.filter(d => basename(d || '.') === SKILL || (d === '' && SKILL === basename(SOURCE.label)))
    if (!roots.length) {
      for (const d of skillDirs.slice(0, 200)) {
        const text = await readText(d ? `${d}/SKILL.md` : 'SKILL.md')
        if (new RegExp(`^name:\\s*["']?${SKILL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\s*$`, 'm').test(text)) roots.push(d)
      }
    }
    if (!roots.length) throw new Error(`No skill named "${SKILL}" in ${SOURCE.label} (found ${skillDirs.length} SKILL.md files${skillDirs.length ? `: ${skillDirs.slice(0, 12).map(d => basename(d || '.')).join(', ')}` : ''}).`)
  } else if (!skillDirs.length) {
    roots = ['']
    notes.push('No SKILL.md found, so the whole repo was treated as one unit (plugin, MCP server or tool).')
  }
  const inRoots = p => roots.some(r => r === '' || p === r || p.startsWith(`${r}/`))
  const picked = all.filter(f => inRoots(f.path))
  return { roots, picked, notes, skillCount: skillDirs.length }
}

function budget(picked) {
  const readable = picked.filter(f => f.kind && f.kind !== 'binary').sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || a.size - b.size)
  const take = []
  const skipped = []
  let total = 0
  for (const f of readable) {
    if (f.size > MAX_FILE || total + f.size > CAP) skipped.push(f)
    else { take.push(f); total += f.size }
  }
  return { take, skipped, total, binaries: picked.filter(f => f.kind === 'binary') }
}

// --- Sources -------------------------------------------------------------------------------

function parseTarget(t) {
  if (existsSync(t)) return { type: 'local', path: resolve(t), label: resolve(t) }
  let m = t.match(/^https?:\/\/(?:www\.)?skills\.sh\/([\w.-]+)\/([\w.-]+)(?:\/([\w.-]+))?/)
  if (m) return { type: 'github', owner: m[1], repo: m[2], skill: m[3], label: `${m[1]}/${m[2]}` }
  m = t.match(/^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/]+)(?:\/(.+?))?)?\/?$/)
  if (m) return { type: 'github', owner: m[1], repo: m[2], ref: m[3], sub: m[4]?.replace(/\/SKILL\.md$/i, ''), label: `${m[1]}/${m[2]}` }
  m = t.match(/^([\w.-]+)\/([\w.-]+)$/)
  if (m) return { type: 'github', owner: m[1], repo: m[2], label: t }
  return null
}

const SOURCE = parseTarget(target)
if (!SOURCE) {
  console.log(`Can't read "${target}": give owner/repo, a github.com URL, a skills.sh URL or a local folder.`)
  process.exit(1)
}

async function fromGithub(s) {
  const ref = s.ref ?? 'HEAD'
  const res = await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`, {
    headers: { 'User-Agent': 'mantle-atlas-vet', Accept: 'application/vnd.github+json' },
  })
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get('x-ratelimit-reset'))
    const when = reset ? ` Try again after ${new Date(reset * 1000).toLocaleTimeString()}.` : ''
    throw new Error(`GitHub's API rate limit for unauthenticated requests (60/hour) is used up.${when} Or clone the repo and run vet.mjs on the local folder.`)
  }
  if (res.status === 404) throw new Error(`${s.label}${s.ref ? `@${s.ref}` : ''} not found on GitHub (private, renamed or a typo).`)
  if (!res.ok) throw new Error(`GitHub API answered ${res.status} ${res.statusText}.`)
  const tree = await res.json()
  const all = tree.tree.filter(e => e.type === 'blob').map(e => ({ path: e.path, size: e.size ?? 0, kind: kindOf(e.path) }))
  const scoped = s.sub ? all.filter(f => f.path === s.sub || f.path.startsWith(`${s.sub}/`)) : all
  const raw = p => `https://raw.githubusercontent.com/${s.owner}/${s.repo}/${ref}/${p.split('/').map(encodeURIComponent).join('/')}`
  const readText = async p => {
    for (let i = 0; i < 2; i++) try { const r = await fetch(raw(p)); if (r.ok) return await r.text() } catch {}
    return ''
  }
  return { all: scoped, readText, truncated: tree.truncated, ref: ref === 'HEAD' ? 'default branch' : ref }
}

function fromLocal(s) {
  const base = statSync(s.path).isDirectory() ? s.path : dirname(s.path)
  const all = []
  ;(function walk(dir) {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', '__pycache__', '.venv', 'venv'].includes(d.name)) continue
      const p = join(dir, d.name)
      if (d.isDirectory()) walk(p)
      else if (d.isFile()) all.push({ path: relative(base, p).replace(/\\/g, '/'), size: statSync(p).size, kind: kindOf(p) })
    }
  })(base)
  const readText = async p => { try { return readFileSync(join(base, p), 'utf8') } catch { return '' } }
  return { all, readText, truncated: false, ref: 'local' }
}

// --- Checks --------------------------------------------------------------------------------
// Each rule: severity (high | review | info), what it means, and a line test. `md` rules only
// run on markdown; `code` only on scripts and code fences inside markdown.

const NET_SEND = /\b(fetch\s*\(|axios\.(post|put|request)|requests\.(post|put)|httpx\.(post|put)|urllib\.request\.urlopen|http\.request|curl\b[^\n]*\s(-d|--data\S*|-F|--form|-T|--upload-file|-X\s*POST)\b|wget\b[^\n]*--post|Invoke-(WebRequest|RestMethod)[^\n]*-(Method\s+Post|Body|InFile)|nc\s+-?\w*\s+\S+\s+\d+)/i
const ENV_DUMP = /(JSON\.stringify\(\s*process\.env\s*\)|json\.dumps\(\s*(dict\()?os\.environ|\bprintenv\b\s*(\||>|$)|(^|[\s;&|(])env\s*(\||>)|(Get-ChildItem|gci|dir)\s+env:[^\n]*(\||>)|\$\(env\)|Object\.(entries|keys)\(\s*process\.env\s*\)[^\n]*(fetch|post|send|write))/i
const ENV_COPY = /(process\.env(?!\s*\.\s*\w|\s*\[)|os\.environ(?!\s*\.\s*get|\s*\[|\s*\.\s*setdefault))/
const CRED = /(~|\$HOME|%USERPROFILE%|\$env:USERPROFILE|homedir\(\)|expanduser\([^)]*\))?[^\n]*(\.ssh\/|\.ssh\\|id_rsa|id_ed25519|id_ecdsa|\.aws[\/\\]credentials|\.config[\/\\]gcloud|\.netrc\b|\.git-credentials|\.docker[\/\\]config\.json|\.kube[\/\\]config|\.claude[\/\\]\.credentials|Login Data|Local State|Cookies\.(sqlite|db)|key4\.db|logins\.json|wallet\.dat|Library[\/\\]Keychains|find-(generic|internet)-password|security\s+dump-keychain|CredRead|cmdkey\s+\/list|Get-StoredCredential)/i
const WRITE_OP = /(>>|(^|[^-=<>!])>\s*["'~$\/\w]|\btee\b|Add-Content|Set-Content|Out-File|appendFile|writeFile|\.write\(|open\([^)]*['"][aw]\+?['"]|fs\.\w*(write|append)|Copy-Item|\bcp\s|\bmv\s|sed\s+-i)/
const PROFILE = /(\.bashrc|\.zshrc|\.bash_profile|\.zprofile|(^|[\/\s~])\.profile\b|\.config\/fish\/config\.fish|\$PROFILE\b|PowerShell_profile\.ps1|\bcrontab\b|launchctl\s+load|LaunchAgents|schtasks\s+\/create|CurrentVersion\\Run|systemctl\s+(--user\s+)?enable)/i
const CLAUDE_CFG = /(\.claude[\/\\](settings(\.local)?\.json|hooks|CLAUDE\.md|agents|commands|skills)|\.claude\.json|claude_desktop_config\.json|\.cursor[\/\\]mcp\.json|"hooks"\s*:\s*\{|\b(PreToolUse|PostToolUse|SessionStart|UserPromptSubmit)\b)/

const RULES = [
  { id: 'pipe-to-shell', sev: 'high', what: 'Pipes a download straight into a shell', code: true,
    test: l => /\b(curl|wget|fetch)\b[^\n|]*\|\s*(sudo\s+)?(ba|z|da|k|fi)?sh\b/i.test(l) || /\bwget\b[^\n]*-O\s*-[^\n]*\|/i.test(l) || /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(python3?|node|perl|ruby)\b/i.test(l) || /\b(iwr|irm|Invoke-WebRequest|Invoke-RestMethod|DownloadString)\b[^\n]*\|\s*(iex|Invoke-Expression)\b/i.test(l) || /\b(iex|Invoke-Expression)\b\s*[(\s]*\(?\s*(\(?New-Object\s+Net\.WebClient|iwr|irm|Invoke-WebRequest|Invoke-RestMethod)/i.test(l) || /\b(ba|z)?sh\s+(-c\s+["']?\$\(|<\(\s*)(curl|wget)/i.test(l) },
  { id: 'exec-decoded', sev: 'high', what: 'Runs downloaded or base64-decoded content', code: true,
    test: l => /\b(eval|exec|execSync|spawnSync|Function)\s*\([^\n]*(atob|b64decode|base64|Buffer\.from\([^)]*base64|fromCharCode|requests\.get|urlopen|fetch\()/i.test(l) || /base64\s+(-d|--decode|-D)\b[^\n]*\|\s*(sudo\s+)?(ba|z)?sh\b/i.test(l) || /FromBase64String[^\n]*(iex|Invoke-Expression)|(iex|Invoke-Expression)[^\n]*FromBase64String/i.test(l) || /\bpowershell(\.exe)?\b[^\n]*\s-(e|enc|EncodedCommand)\s+[A-Za-z0-9+/=]{20,}/i.test(l) || /\bexec\s*\(\s*compile\s*\(/.test(l) || /\b__import__\s*\(\s*['"]base64['"]\s*\)/.test(l) },
  { id: 'credential-read', sev: 'high', what: 'Touches credential stores (SSH keys, cloud credentials, browser profiles, keychain)', test: l => CRED.test(l) },
  { id: 'dotenv-read', sev: 'review', what: 'Reads .env files (secrets usually live there)', code: true, test: l => /(readFile\w*|open|cat|type|Get-Content|load_dotenv|dotenv)\b[^\n]*['"\s(]\.env\b/i.test(l) },
  { id: 'env-dump', sev: 'review', what: 'Serializes or prints the whole environment (every secret in it)', code: true, test: l => ENV_DUMP.test(l) },
  { id: 'env-copy', sev: 'info', what: 'Copies the whole environment (usually to pass to a child process)', code: true, test: l => ENV_COPY.test(l) && !ENV_DUMP.test(l) },
  { id: 'exfil-webhook', sev: 'review', what: 'Talks to a paste/webhook/tunnel host often used to collect data', test: l => /(discord(app)?\.com\/api\/webhooks|hooks\.slack\.com\/services|webhook\.site|requestbin|pipedream\.net|ngrok(-free)?\.(io|app)|pastebin\.com|transfer\.sh|0x0\.st|burpcollaborator|interact\.sh|\boast\.(fun|live|me|online|pro|site)\b)/i.test(l) },
  { id: 'shell-profile', sev: 'info', what: 'Mentions shell profiles or autostart (cron, launchd, Run keys)', code: true, test: l => PROFILE.test(l) },
  { id: 'claude-config', sev: 'info', what: 'Mentions Claude/agent settings, hooks or MCP config files', code: true, test: l => CLAUDE_CFG.test(l) },
  { id: 'permission-bypass', sev: 'high', what: 'Turns off permission prompts or the sandbox', test: l => /(--dangerously-skip-permissions|bypassPermissions|dangerouslyDisableSandbox|--permission-mode\s+(bypass|acceptEdits)|--yolo\b|"defaultMode"\s*:\s*"(bypassPermissions|acceptEdits)"|--allow-dangerously)/i.test(l) },
  { id: 'injection', sev: 'high', what: 'Prompt-injection phrasing aimed at the agent', md: true,
    test: l => /\b(ignore|disregard|forget|override)\b[^\n.]{0,30}\b(all\s+)?(previous|prior|above|earlier|system|your)\s+(instructions|prompts?|rules|guidelines|directives)\b/i.test(l) || /\b(do\s*n[o']t|never|without)\s+(tell(ing)?|inform(ing)?|notify(ing)?|mention(ing)?|reveal(ing)?|alert(ing)?|warn(ing)?)\s+(this\s+to\s+)?(the\s+)?user\b/i.test(l) || /\b(hide|conceal|keep)\b[^\n.]{0,25}\bfrom\s+the\s+user\b/i.test(l) || /\byou\s+are\s+now\s+(in\s+)?(DAN|developer\s+mode|jailbroken|unrestricted)/i.test(l) || /\b(new|updated|real|hidden|secret)\s+(system\s+)?instructions\s*:/i.test(l) || /<\/?(system|im_start|admin|instructions?)>/i.test(l) || /\b(silently|quietly|secretly)\s+(run|execute|install|send|upload|delete|modify|add|post)\b/i.test(l) },
  { id: 'hidden-comment', sev: 'review', what: 'HTML comment in markdown with instructions the user won\'t see rendered', md: true, test: l => /<!--(?=[^>]*\b(you|claude|assistant|agent|AI|LLM|model)\b)(?=[^>]*\b(must|should|always|never|run|execute|ignore|install|send|do not|don't)\b)/i.test(l) },
  { id: 'hidden-unicode', sev: 'high', what: 'Invisible bidi or tag characters (text that reads differently than it runs)', raw: true, test: l => /[\u202A-\u202E\u2066-\u2069]|[\u{E0000}-\u{E007F}]/u.test(l) },
  { id: 'zero-width', sev: 'review', what: 'Zero-width characters', raw: true, test: (l, n) => /[\u200B-\u200D\u2060\u180E]/.test(l) || (n > 1 && /\uFEFF/.test(l)) },
  { id: 'base64-blob', sev: 'review', what: 'Long base64 blob (could hide code or data)', raw: true, test: l => /[A-Za-z0-9+/]{240,}={0,2}/.test(l) && !/data:(image|font)\//.test(l) },
  { id: 'obfuscated', sev: 'high', what: 'Obfuscator signatures (_0x names, hex/charcode soup)', code: true, test: l => /\b_0x[0-9a-f]{4,6}\b/.test(l) || (l.match(/\\x[0-9a-f]{2}/gi)?.length ?? 0) > 40 || /fromCharCode\((\s*\d+\s*,){20,}/.test(l) },
  { id: 'remote-download', sev: 'review', what: 'Downloads a file and makes it executable', code: true, test: l => /(curl|wget|Invoke-WebRequest|iwr)\b[^\n]*(-o|-O|--output|-OutFile)\b[^\n]*(&&|;)[^\n]*chmod\s+\+?[0-7]*x/i.test(l) },
  { id: 'net-send', sev: 'info', what: 'Sends data over the network', code: true, test: l => NET_SEND.test(l) },
  { id: 'runtime-install', sev: 'info', what: 'Installs packages at run time', code: true, test: l => /\b(pip3?\s+install|npm\s+(i|install)\s|npx\s+-y\s|pnpm\s+add|yarn\s+add|uvx\s|go\s+install|cargo\s+install|brew\s+install|apt(-get)?\s+install|winget\s+install|choco\s+install)\b/i.test(l) },
]

const TEXT_RULES = new Set(['injection', 'hidden-comment', 'hidden-unicode', 'zero-width', 'base64-blob'])
const SNIP = 140
const clean = s => s.replace(/[\u0000-\u0008\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/gu, c => `<U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}>`).trim()
const snippet = s => { const c = clean(s); return c.length > SNIP ? `${c.slice(0, SNIP)}…` : c }

function scan(path, kind, text) {
  const hits = []
  const lines = text.split(/\r?\n/)
  const isMd = kind === 'md' || kind === 'skill'
  let fence = false
  const netLines = []
  const sensitive = []
  lines.forEach((line, i) => {
    const n = i + 1
    if (isMd && /^\s*(```|~~~)/.test(line)) { fence = !fence; return }
    const inCode = !isMd || fence
    const comment = inCode && /^\s*(\/\/|#(?!!)|\*|\/\*|--\s|REM\s|::|<#|"""|''')/i.test(line)
    for (const r of RULES) {
      if (r.md && !isMd) continue
      if (r.code && !inCode) continue
      if (!r.test(line, n)) continue
      // Injection inside a code fence is usually an example, so it drops to review; a pattern
      // in a code comment doesn't run, so it only counts as context.
      const sev = r.id === 'injection' && fence ? 'review' : comment && !TEXT_RULES.has(r.id) ? 'info' : r.sev
      hits.push({ rule: r.id, sev, what: r.what, path, line: n, text: snippet(line) })
      if (r.id === 'net-send') netLines.push(n)
      if (!comment && ['env-dump', 'credential-read', 'dotenv-read'].includes(r.id)) sensitive.push(n)
    }
    // A write to a shell profile or Claude config is more than a mention.
    if (inCode && WRITE_OP.test(line) && (PROFILE.test(line) || CLAUDE_CFG.test(line))) hits.push({ rule: 'config-write', sev: comment ? 'info' : 'high', what: 'Writes to a shell profile, autostart or Claude/agent config', path, line: n, text: snippet(line) })
  })
  // Secrets read within a few lines of a network send look like exfiltration.
  for (const s of sensitive) {
    const near = netLines.find(n => Math.abs(n - s) <= 5)
    if (near) hits.push({ rule: 'exfil', sev: 'high', what: 'Reads secrets and sends data over the network close by', path, line: s, text: `secret at line ${s}, network send at line ${near}` })
  }
  if (kind === 'script' || kind === 'config') {
    const long = lines.filter(l => l.length > 1000).length
    const avg = text.length / Math.max(lines.length, 1)
    if (text.length > 2000 && (long > 0 || avg > 300)) hits.push({ rule: 'minified', sev: 'review', what: 'Minified or packed script (hard to read, so hard to trust)', path, line: lines.findIndex(l => l.length > 1000) + 1 || 1, text: `${lines.length} lines, average ${Math.round(avg)} chars, ${long} over 1000` })
  }
  if (path.endsWith('hooks.json') || (kind === 'config' && /"hooks"\s*:/.test(text))) hits.push({ rule: 'ships-hooks', sev: 'review', what: 'Ships hooks: commands that run automatically on agent events', path, line: lines.findIndex(l => /hooks/.test(l)) + 1 || 1, text: 'read every command in it' })
  return hits
}

const domains = text => [...text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(?=[\/:\s"'`)\]]|$)/gi)].map(m => m[1].toLowerCase())

// --- Run -----------------------------------------------------------------------------------

let src
try {
  src = SOURCE.type === 'local' ? fromLocal(SOURCE) : await fromGithub(SOURCE)
} catch (e) {
  console.log(`Could not list ${SOURCE.label}: ${e.cause?.code ?? ''} ${e.message}`.replace(/\s+/g, ' ').trim())
  process.exit(2)
}

let chosen
try {
  chosen = await choose(src.all, src.readText)
} catch (e) {
  console.log(e.message)
  process.exit(1)
}
if (SOURCE.skill && !SKILL) chosen.notes.push(`The skills.sh URL names "${SOURCE.skill}"; pass --skill ${SOURCE.skill} to vet only that skill.`)
const { take, skipped, total, binaries } = budget(chosen.picked)

const findings = []
const hosts = new Set()
const failed = []
for (let i = 0; i < take.length; i += 8) {
  const batch = await Promise.all(take.slice(i, i + 8).map(async f => ({ f, text: await src.readText(f.path) })))
  for (const { f, text } of batch) {
    if (!text && f.size > 0) { failed.push(f.path); continue }
    findings.push(...scan(f.path, f.kind, text))
    if (f.kind !== 'md' && f.kind !== 'skill') for (const d of domains(text)) hosts.add(d)
  }
}
for (const b of binaries) findings.push({ rule: 'binary', sev: 'review', what: 'Ships a compiled binary this check cannot read', path: b.path, line: 0, text: `${(b.size / 1024).toFixed(0)} KB` })

const high = findings.filter(f => f.sev === 'high')
const review = findings.filter(f => f.sev === 'review')
const verdict = high.length ? 'high risk' : review.length ? 'review' : 'low risk'
const partial = skipped.length || failed.length || src.truncated
const reasons = [...new Map([...high, ...review].map(f => [f.rule, `${f.what} (${[...high, ...review].filter(x => x.rule === f.rule).length})`])).values()]

const result = {
  source: SOURCE.label, ref: src.ref, skill: SKILL ?? null,
  scope: chosen.roots.map(r => r || '.'), skillFolders: chosen.skillCount,
  verdict, partial: Boolean(partial), reasons,
  scanned: { files: take.length - failed.length, bytes: total, skipped: skipped.map(f => f.path), unreadable: failed, treeTruncated: Boolean(src.truncated) },
  findings, hosts: [...hosts].sort(), notes: chosen.notes,
  disclaimer: 'Heuristic static check, not a guarantee. It reads text only, cannot see code downloaded later or what a remote server does, and can flag security tools that mention these patterns on purpose.',
}

if (JSON_OUT) {
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

const out = []
const say = l => out.push(l)
say(`# Vet: ${SOURCE.label}${SKILL ? ` (skill ${SKILL})` : ''}`)
say('')
say(`**Verdict: ${verdict.toUpperCase()}**${partial ? ' (partial scan)' : ''}${reasons.length ? ` — ${reasons.join('; ')}` : ' — no risky patterns found in what was read.'}`)
say('')
const scopeText = chosen.roots.length > 6 ? `${chosen.roots.length} skill folders` : chosen.roots.map(r => `\`${r || '.'}\``).join(', ')
say(`Scanned ${take.length - failed.length} files (${(total / 1024).toFixed(0)} KB) in ${scopeText}, ${src.ref}.${skipped.length ? ` Skipped ${skipped.length} over the size cap: ${skipped.slice(0, 5).map(f => f.path).join(', ')}${skipped.length > 5 ? ', …' : ''}.` : ''}${failed.length ? ` Could not fetch: ${failed.slice(0, 5).join(', ')}.` : ''}${src.truncated ? ' GitHub truncated the file list (very large repo); vet a single --skill.' : ''}`)
for (const n of chosen.notes) say(`\n_${n}_`)

const PER_RULE = 5
for (const [sev, title] of [['high', 'High risk'], ['review', 'Worth a look'], ['info', 'For context']]) {
  const list = findings.filter(f => f.sev === sev)
  if (!list.length) continue
  say(`\n## ${title}`)
  for (const rule of [...new Set(list.map(f => f.rule))]) {
    const items = list.filter(f => f.rule === rule)
    say(`- **${items[0].what}** (${items.length})`)
    for (const f of items.slice(0, PER_RULE)) say(`  - \`${f.path}${f.line ? `:${f.line}` : ''}\` ${f.text ? `— \`${f.text.replace(/`/g, "'")}\`` : ''}`)
    if (items.length > PER_RULE) say(`  - … ${items.length - PER_RULE} more`)
  }
}
if (hosts.size) say(`\n**Hosts named in scripts:** ${[...hosts].sort().slice(0, 25).join(', ')}${hosts.size > 25 ? ', …' : ''}`)

say(`\n_${result.disclaimer} Read the flagged lines yourself before installing; skills.sh also shows security audits on each skill page._`)
console.log(out.join('\n'))
