import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import {
  PALETTES,
  claudeCodeTheme,
  isHex,
  paletteById,
  terminalScheme,
} from '../chrome-extension/palettes.js'
import type { Palette } from '../chrome-extension/palettes.js'
import type { MantleConfig, MantleLive } from '../types'

const PANE = 'mantle-studio'
const COMMAND = 'mantle'
// The slug Claude Code knows the live theme by: ~/.claude/themes/mantle.json.
const THEME_SLUG = 'mantle'
const PROFILE_GUID = '{d1f4b7a2-3c6e-4f81-9a2b-5e7c0d9f4a11}'
const EXTENSION_FILES = ['manifest.json', 'content.js', 'popup.html', 'popup.css', 'popup.js', 'palettes.js']
const MAX_WALLPAPER_BYTES = 3 * 1024 * 1024

export const DEFAULT_CONFIG: MantleConfig = {
  preset: 'aurora',
  targets: { code: true, terminal: true, web: true },
  reactive: true,
  code: { preset: '', accent: '', thinking: '', working: '', messageBg: '' },
  terminal: { preset: '', wallpaper: '', imageOpacity: 30, opacity: 85, acrylic: true, font: 'Cascadia Code', background: '', profiles: [], everywhere: false, follow: false },
  web: { preset: '', wallpaper: '', blur: 6, dim: 35, panelOpacity: 78, accent: '', reactive: true },
}

const config = atom({ plugin: 'mantle', key: 'config' } as const, DEFAULT_CONFIG)
const tab = atom({ plugin: 'mantle', key: 'tab' } as const, 'code')
const live = atom({ plugin: 'mantle', key: 'live' } as const, 'idle' as MantleLive)
const log = atom({ plugin: 'mantle', key: 'log' } as const, [] as string[])

type $ = EngineInterface

// ---- module-local runtime (a reload starts these over, which is fine) ------

let inFlight = 0
let isPlan = false
let settleTimer: Timer | undefined
let writeTimer: Timer | undefined

const rest = (): MantleLive => (isPlan ? 'plan' : 'idle')

// ---- config ---------------------------------------------------------------

function withDefaults(stored: unknown): MantleConfig {
  const c = (stored ?? {}) as Partial<MantleConfig>
  return {
    ...DEFAULT_CONFIG,
    ...c,
    targets: { ...DEFAULT_CONFIG.targets, ...c.targets },
    code: { ...DEFAULT_CONFIG.code, ...c.code },
    terminal: { ...DEFAULT_CONFIG.terminal, ...c.terminal },
    web: { ...DEFAULT_CONFIG.web, ...c.web },
  }
}

async function setConfig($: $, fn: (c: MantleConfig) => MantleConfig): Promise<MantleConfig> {
  await update($, config, fn)
  const next = await read($, config)
  await $.store.set('config', next)
  return next
}

async function say($: $, lines: string | string[]): Promise<void> {
  await update($, log, list => [...list, ...(typeof lines === "string" ? [lines] : lines)].slice(-8))
}

// ---- paths ----------------------------------------------------------------

async function claudeDir($: $): Promise<string> {
  const custom = await $.env.get('CLAUDE_CONFIG_DIR')
  if (custom) return custom
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? '.'
  return `${home}/.claude`
}

async function extensionDir($: $): Promise<string> {
  return `${await claudeDir($)}/mantle/chrome-extension`
}

// ---- Claude Code ----------------------------------------------------------

export function codePalette(c: MantleConfig): Palette {
  const p = paletteById(c.code.preset || c.preset)
  return {
    ...p,
    accent: isHex(c.code.accent) ? c.code.accent : p.accent,
    accent2: isHex(c.code.thinking) ? c.code.thinking : p.accent2,
    info: isHex(c.code.working) ? c.code.working : p.info,
  }
}

export function codeTheme(c: MantleConfig, state: MantleLive) {
  const custom: Record<string, string> = {}
  if (isHex(c.code.messageBg)) custom.userMessageBackground = c.code.messageBg
  return claudeCodeTheme(codePalette(c), {
    state: c.reactive ? state : 'idle',
    custom,
    name: 'Mantle (live)',
  })
}

async function writeCodeTheme($: $, c: MantleConfig, state: MantleLive): Promise<void> {
  const theme = codeTheme(c, state)
  await $.fs.write(`${await claudeDir($)}/themes/${THEME_SLUG}.json`, JSON.stringify(theme, null, 2) + '\n')
}

async function selectCodeTheme($: $): Promise<string> {
  const value = `custom:${THEME_SLUG}`
  const row = (await $.config.list()).find(r => r.key === 'theme')
  if (row?.value === value) return 'Claude Code already uses Mantle (live).'
  const answer = (await $.config.set({ key: 'theme', value })) as { deny?: string }
  if (answer.deny) return `Pick "Mantle (live)" in /theme once (${answer.deny}).`
  return 'Claude Code switched to Mantle (live).'
}

async function applyCode($: $, c: MantleConfig): Promise<string[]> {
  await writeCodeTheme($, c, await read($, live))
  return [`Claude Code: ${paletteById(c.code.preset || c.preset).name} written.`, await selectCodeTheme($)]
}

// ---- Windows Terminal -----------------------------------------------------

// Windows Terminal 1.24+ loads a fragment's images only from the fragment's own
// folder, so the wallpaper is copied next to mantle.json and named relatively.
export function wallpaperFile(path: string): string {
  return path ? `wall-${(path.split(/[\\/]/).pop() ?? 'wallpaper').replace(/[^\w.-]+/g, '-')}` : ''
}

export function terminalFragment(c: MantleConfig, active: string[] = []) {
  const p = paletteById(c.terminal.preset || c.preset)
  const custom = isHex(c.terminal.background)
  const own = terminalScheme(p, { background: c.terminal.background })
  if (custom) own.name = 'Mantle Custom'
  const schemes = PALETTES.map(x => terminalScheme(x))
  if (custom) schemes.push(own)
  const look: Record<string, unknown> = {
    colorScheme: own.name,
    opacity: c.terminal.opacity,
    useAcrylic: c.terminal.acrylic,
  }
  if (c.terminal.wallpaper) {
    look.backgroundImage = wallpaperFile(c.terminal.wallpaper)
    look.backgroundImageOpacity = c.terminal.imageOpacity / 100
    look.backgroundImageStretchMode = 'uniformToFill'
  }
  const profile: Record<string, unknown> = {
    guid: PROFILE_GUID,
    name: 'Claude · Mantle',
    commandline: 'powershell.exe -NoLogo -NoExit -Command claude',
    startingDirectory: '%USERPROFILE%',
    tabColor: p.accent,
    cursorShape: 'bar',
    font: { face: c.terminal.font || 'Cascadia Code' },
    ...look,
  }
  // The profile of every tab where Claude is running right now (`active`) gets
  // the look through "updates", so the wallpaper appears when Claude starts and
  // goes when it quits. `/mantle terminal everywhere on` keeps it on for good.
  const mine = [...new Set([...(c.terminal.everywhere ? (c.terminal.profiles ?? []) : []), ...active])]
  const updates = mine.filter(g => g.toLowerCase() !== PROFILE_GUID).map(g => ({ updates: g, ...look }))
  return { profiles: [profile, ...updates], schemes }
}

// ---- iTerm2 (macOS) -----------------------------------------------------------

const ITERM_GUID = 'mantle-claude-profile'

function itermColor(hex: string) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
  return { 'Red Component': ((n >> 16) & 255) / 255, 'Green Component': ((n >> 8) & 255) / 255, 'Blue Component': (n & 255) / 255, 'Alpha Component': 1, 'Color Space': 'sRGB' }
}

// An iTerm2 Dynamic Profile: iTerm2 watches its DynamicProfiles folder and picks
// this up live. Your own profiles are never touched.
export function itermProfile(c: MantleConfig) {
  const p = paletteById(c.terminal.preset || c.preset)
  const s = terminalScheme(p, { background: c.terminal.background })
  const profile: Record<string, unknown> = {
    Name: 'Claude · Mantle',
    Guid: ITERM_GUID,
    Tags: ['Mantle'],
    'Background Color': itermColor(s.background),
    'Foreground Color': itermColor(s.foreground),
    'Cursor Color': itermColor(s.cursorColor),
    'Selection Color': itermColor(s.selectionBackground),
    'Bold Color': itermColor(s.foreground),
    'Link Color': itermColor(p.accent),
    'Tab Color': itermColor(p.accent),
    'Use Tab Color': true,
    Transparency: Math.round((1 - c.terminal.opacity / 100) * 100) / 100,
    Blur: c.terminal.acrylic,
    'Blur Radius': 12,
  }
  p.ansi.forEach((hex: string, i: number) => (profile[`Ansi ${i} Color`] = itermColor(hex)))
  if (c.terminal.wallpaper) {
    profile['Background Image Location'] = c.terminal.wallpaper
    profile['Background Image Mode'] = 2
    // Blend is how much of the background color covers the image.
    profile.Blend = Math.round((1 - c.terminal.imageOpacity / 100) * 100) / 100
  }
  return { Profiles: [profile] }
}

async function applyIterm($: $, c: MantleConfig, home: string): Promise<string[]> {
  const dir = `${home}/Library/Application Support/iTerm2`
  if (!(await $.fs.exists(dir))) {
    return ["Terminal: wallpapers on macOS need iTerm2 (iterm2.com); Terminal.app can't load one from a file. Claude Code's colors still apply."]
  }
  await $.fs.write(`${dir}/DynamicProfiles/mantle.json`, JSON.stringify(itermProfile(c), null, 2) + '\n')
  return ['Terminal: iTerm2 profile "Claude · Mantle" updated; your other profiles are untouched. Run /mantle open to start Claude in it here.']
}

async function applyTerminal($: $, c: MantleConfig): Promise<string[]> {
  if (c.terminal.wallpaper && !(await $.fs.exists(c.terminal.wallpaper))) {
    return [`Terminal: wallpaper not found at ${c.terminal.wallpaper}.`]
  }
  const local = await $.env.get('LOCALAPPDATA')
  if (!local) {
    const home = await $.env.get('HOME')
    if (home && (await $.fs.exists(`${home}/Library`))) return applyIterm($, c, home)
    return ['Terminal: wallpapers are set up for Windows Terminal and iTerm2 (macOS); skipped here. Claude Code\'s colors still apply.']
  }
  const dir = `${local}\\Microsoft\\Windows Terminal\\Fragments\\Mantle`
  if (c.terminal.wallpaper) {
    const from = `file:///${encodeURI(c.terminal.wallpaper.replaceAll('\\', '/'))}`
    const got = await $.process.run(['curl', '--fail', '--silent', '--show-error', '--create-dirs', '-o', `${dir}\\${wallpaperFile(c.terminal.wallpaper)}`, from], { timeoutMs: 60_000 })
    if (got.exitCode !== 0) return [`Terminal: could not copy the wallpaper (${got.stderr.trim() || `curl exited ${got.exitCode}`}).`]
  }
  await $.fs.write(`${dir}\\mantle.json`, JSON.stringify(terminalFragment(c, c.terminal.follow ? await activeProfiles($) : []), null, 2) + '\n')
  // Windows Terminal reads fragments only when it (re)loads its settings, and it
  // reloads when settings.json's timestamp changes. Bump the timestamp (the
  // contents are left exactly as they are) so the change shows without a restart.
  const touch =
    "Get-ChildItem \"$env:LOCALAPPDATA\\Packages\\Microsoft.WindowsTerminal*\\LocalState\\settings.json\",\"$env:LOCALAPPDATA\\Microsoft\\Windows Terminal\\settings.json\" -ErrorAction SilentlyContinue | ForEach-Object { $_.LastWriteTime = Get-Date }"
  await $.process.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', touch], { timeoutMs: 15_000 }).catch(() => undefined)
  if (c.terminal.everywhere) return ['Terminal: your profile now keeps the wallpaper all the time (/mantle terminal everywhere off to undo).']
  if (c.terminal.follow && (await $.env.get('WT_PROFILE_ID'))) return ['Terminal: wallpaper is on in this profile while Claude runs; it goes away when you quit Claude.']
  if ((await $.env.get('WT_PROFILE_ID')) && !(await hasShortcut($))) {
    return ['Terminal: "Claude · Mantle" tab updated; your other tabs stay plain. Run /mantle shortcut on so typing claude opens it, or /mantle open now.']
  }
  return ['Terminal: "Claude · Mantle" profile updated. Start Claude inside Windows Terminal to get the wallpaper there, or run /mantle open.']
}

// ---- the `claude` shortcut (PowerShell) -------------------------------------------

const SHORTCUT_START = '# >>> mantle shortcut >>>'
const SHORTCUT_END = '# <<< mantle shortcut <<<'

// ASCII only: Windows PowerShell 5.1 reads a BOM-less profile in the ANSI code page.
export const SHORTCUT = [
  SHORTCUT_START,
  '# Added by Mantle (/mantle shortcut off removes it). In Windows Terminal, `claude`',
  '# opens in its own Claude - Mantle tab in this folder, so only that tab shows the',
  '# wallpaper. Set $env:MANTLE_INLINE = 1 to run Claude in the current tab instead.',
  'function claude {',
  `  if ($env:WT_SESSION -and $env:WT_PROFILE_ID -ne '${PROFILE_GUID}' -and -not $env:MANTLE_INLINE) {`,
  "    $dir = (Get-Location).ProviderPath.TrimEnd('\\') + '\\.'",
  "    $rest = ($args | ForEach-Object { \"'\" + (\"$_\" -replace \"'\", \"''\") + \"'\" }) -join ' '",
  `    wt.exe -w 0 nt -p '${PROFILE_GUID}' -d $dir powershell.exe -NoLogo -NoExit -Command ("claude " + $rest).Replace(';', '\\;')`,
  '    return',
  '  }',
  '  $real = Get-Command claude -CommandType Application, ExternalScript -ErrorAction SilentlyContinue | Select-Object -First 1',
  '  if ($real) { & $real.Source @args } else { Write-Error "claude is not on PATH" }',
  '}',
  SHORTCUT_END,
].join('\r\n')

// The PowerShell profile files that exist or can be created: Windows PowerShell
// always, PowerShell 7 when it is installed.
async function profilePaths($: $): Promise<string[]> {
  const out: string[] = []
  for (const shell of ['powershell.exe', 'pwsh.exe']) {
    const r = await $.process
      .run([shell, '-NoProfile', '-NonInteractive', '-Command', '$PROFILE.CurrentUserCurrentHost'], { timeoutMs: 15_000 })
      .catch(() => undefined)
    const path = r && r.exitCode === 0 ? r.stdout.trim() : ''
    if (path && !out.includes(path)) out.push(path)
  }
  return out
}

function withoutShortcut(text: string): string {
  const a = text.indexOf(SHORTCUT_START)
  const b = text.indexOf(SHORTCUT_END)
  if (a < 0 || b < a) return text
  return (text.slice(0, a).replace(/\s+$/, '') + '\r\n' + text.slice(b + SHORTCUT_END.length).replace(/^\s+/, '')).trim() + '\r\n'
}

async function hasShortcut($: $): Promise<boolean> {
  for (const path of await profilePaths($)) {
    if ((await $.fs.exists(path)) && String(await $.fs.read(path)).includes(SHORTCUT_START)) return true
  }
  return false
}

async function setShortcut($: $, isOn: boolean): Promise<string[]> {
  if (!(await $.env.get('LOCALAPPDATA'))) return ['The claude shortcut is for PowerShell in Windows Terminal. On macOS use /mantle open.']
  const paths = await profilePaths($)
  if (paths.length === 0) return ['Could not find your PowerShell profile path.']
  const done: string[] = []
  for (const path of paths) {
    const before = (await $.fs.exists(path)) ? String(await $.fs.read(path)) : ''
    const base = withoutShortcut(before)
    const next = isOn ? `${base.trim() ? `${base.trimEnd()}\r\n\r\n` : ''}${SHORTCUT}\r\n` : base
    if (next !== before) {
      await $.fs.write(path, next)
      done.push(path)
    }
  }
  if (!isOn) return done.length ? [`Removed the claude shortcut from ${done.join(' and ')}.`] : ['The claude shortcut was not installed.']
  // A Restricted or AllSigned policy skips profile scripts, so the shortcut would never load.
  const policy = await $.process.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', 'Get-ExecutionPolicy'], { timeoutMs: 15_000 }).catch(() => undefined)
  const blocked = policy && /^(Restricted|AllSigned)$/i.test(policy.stdout.trim())
  return [
    ...(blocked ? [`PowerShell's execution policy is ${policy.stdout.trim()}, which skips profile scripts. Allow local scripts once with: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`] : []),
    `Added the claude shortcut to ${(done.length ? done : paths).join(' and ')}.`,
    'Open a new PowerShell tab, type claude: it opens in its own Claude · Mantle tab with the wallpaper, and your other tabs stay plain.',
    'Run Claude in the current tab once with $env:MANTLE_INLINE = 1; remove the shortcut with /mantle shortcut off.',
  ]
}

// /mantle open: start Claude in a new tab that uses the Claude · Mantle profile,
// in this session's folder, so the wallpaper is there only while you use Claude.
async function openClaudeTab($: $): Promise<string> {
  const cwd = await $.session.cwd()
  if (await $.env.get('LOCALAPPDATA')) {
    const r = await $.process.run(['wt.exe', '-w', '0', 'nt', '-p', 'Claude · Mantle', '-d', cwd], { timeoutMs: 15_000 })
    return r.exitCode === 0 ? `Opened Claude in a "Claude · Mantle" tab at ${cwd}.` : `Could not open Windows Terminal (${r.stderr.trim() || `exit ${r.exitCode}`}). Is it installed?`
  }
  // A new iTerm2 window on the Mantle profile, then cd here and start Claude in it.
  const dir = cwd.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
  const script = [
    'tell application "iTerm"',
    '  set w to (create window with profile "Claude · Mantle")',
    `  tell current session of w to write text "cd " & quoted form of "${dir}" & " && claude"`,
    'end tell',
  ].join('\n')
  const r = await $.process.run(['osascript', '-e', script], { timeoutMs: 15_000 })
  return r.exitCode === 0 ? 'Opened Claude in a new iTerm2 window with the "Claude · Mantle" profile.' : `Could not open iTerm2 (${r.stderr.trim() || `exit ${r.exitCode}`}).`
}

// Tabs where Claude is running, across every open Claude session:
// ~/.claude/mantle/terminal-sessions.json maps a session to its tab's profile.
const SESSION_KEY = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const STALE_MS = 12 * 60 * 60 * 1000
type ActiveTabs = Record<string, { profile: string; at: number }>

async function activeFile($: $): Promise<string> {
  return `${await claudeDir($)}/mantle/terminal-sessions.json`
}

async function readActive($: $): Promise<ActiveTabs> {
  const path = await activeFile($)
  if (!(await $.fs.exists(path))) return {}
  try {
    return JSON.parse((await $.fs.read(path)) as string) as ActiveTabs
  } catch {
    return {}
  }
}

async function activeProfiles($: $): Promise<string[]> {
  return [...new Set(Object.values(await readActive($)).map(v => v.profile))]
}

// Marks this session's tab as running Claude (or not). False outside Windows Terminal.
async function markActive($: $, isOn: boolean): Promise<boolean> {
  const guid = await $.env.get('WT_PROFILE_ID')
  if (!guid) return false
  const now = await $.clock.now()
  const tabs = await readActive($)
  for (const [k, v] of Object.entries(tabs)) if (now - v.at > STALE_MS) delete tabs[k]
  if (isOn) tabs[SESSION_KEY] = { profile: guid, at: now }
  else delete tabs[SESSION_KEY]
  await $.fs.write(await activeFile($), JSON.stringify(tabs))
  return true
}

// Runs inside Windows Terminal: remember the profile this tab uses so it gets
// the theme too. Outside it (VS Code, another terminal) say what will happen.
async function rememberProfile($: $): Promise<string | null> {
  const guid = await $.env.get('WT_PROFILE_ID')
  if (guid) {
    if ((await read($, config)).terminal.follow) await markActive($, true)
    const c = await read($, config)
    if (!(c.terminal.profiles ?? []).includes(guid) && guid.toLowerCase() !== PROFILE_GUID) {
      await setConfig($, x => ({ ...x, terminal: { ...x.terminal, profiles: [...(x.terminal.profiles ?? []), guid] } }))
    }
    return null
  }
  if ((await $.env.get('TERM_PROGRAM')) === 'vscode') {
    return "VS Code: its terminal and the Claude Code extension can't show wallpapers; they follow your VS Code color theme. The wallpaper still goes to Windows Terminal and claude.ai."
  }
  return null
}

// ---- claude.ai --------------------------------------------------------------

async function installExtension($: $): Promise<string> {
  const dir = await extensionDir($)
  for (const file of EXTENSION_FILES) {
    const text = await $.fs.read(`${$.plugin.root}/chrome-extension/${file}`)
    await $.fs.write(`${dir}/${file}`, text as string)
  }
  return dir
}

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
}

async function wallpaperSource($: $, wallpaper: string): Promise<string | { error: string }> {
  if (!wallpaper) return ''
  if (/^https?:\/\//i.test(wallpaper)) return wallpaper
  const ext = wallpaper.split('.').pop()?.toLowerCase() ?? ''
  const mime = MIME[ext]
  if (!mime) return { error: `unsupported image type .${ext}` }
  const stat = await $.fs.stat(wallpaper).catch(() => undefined)
  if (!stat) return { error: `not found: ${wallpaper}` }
  if (stat.size > MAX_WALLPAPER_BYTES) return { error: 'image over 3 MB; use a smaller one or an https URL' }
  const { base64 } = (await $.fs.read(wallpaper, { as: 'bytes' })) as { base64: string }
  return `data:${mime};base64,${base64}`
}

async function applyWeb($: $, c: MantleConfig): Promise<string[]> {
  const dir = await extensionDir($)
  const isFresh = !(await $.fs.exists(`${dir}/manifest.json`))
  if (isFresh) await installExtension($)
  const wallpaper = await wallpaperSource($, c.web.wallpaper || c.terminal.wallpaper)
  if (typeof wallpaper !== 'string') return [`claude.ai: wallpaper ${wallpaper.error}.`]
  const p = paletteById(c.web.preset || c.preset)
  const payload = {
    version: 1,
    updatedAt: await $.clock.now(),
    palette: p,
    accent: c.web.accent,
    wallpaper,
    blur: c.web.blur,
    dim: c.web.dim,
    panelOpacity: c.web.panelOpacity,
    reactive: c.web.reactive,
  }
  await $.fs.write(`${dir}/mantle-theme.json`, JSON.stringify(payload))
  return isFresh
    ? [`claude.ai: extension files written to ${dir}.`, 'Load it once: chrome://extensions → Developer mode → Load unpacked → that folder.']
    : [`claude.ai: ${p.name} synced to the Mantle extension. Not loaded in Chrome yet? chrome://extensions → Developer mode → Load unpacked → ${dir}`]
}

async function applyAll($: $): Promise<void> {
  const note = await rememberProfile($)
  const c = await read($, config)
  const lines: string[] = note ? [note] : []
  const failed = (label: string) => (err: Error) => [`${label}: failed (${err.message}).`]
  if (c.targets.code) lines.push(...(await applyCode($, c).catch(failed('Claude Code'))))
  if (c.targets.terminal) lines.push(...(await applyTerminal($, c).catch(failed('Terminal'))))
  if (c.targets.web) lines.push(...(await applyWeb($, c).catch(failed('claude.ai'))))
  if (lines.length === 0) lines.push('Every target is off: turn one on first.')
  await say($, lines)
}

// ---- wallpapers ---------------------------------------------------------------

// `/mantle wallpaper <https url | file path | off>`: a URL is downloaded for
// Windows Terminal (which needs a local file) and handed to claude.ai as is;
// a file is used for both. Then every surface that is on is applied.
async function setWallpaper($: $, input: string): Promise<string[]> {
  const target = input.replace(/^"|"$/g, '')
  if (!target) return ['Usage: /mantle wallpaper <https image URL | image file path | off>']
  if (target === 'off') {
    await setConfig($, c => ({ ...c, terminal: { ...c.terminal, wallpaper: '' }, web: { ...c.web, wallpaper: '' } }))
    await applyAll($)
    return ['Wallpaper removed.', ...(await read($, log)).slice(-3)]
  }
  let local = target
  let web = target
  if (/^https:\/\//i.test(target)) {
    // Readable, safe file name: decode %xx, keep the extension, trim the stem.
    let raw = (target.split('?')[0] ?? '').split('/').pop() || 'wallpaper'
    try {
      raw = decodeURIComponent(raw)
    } catch {}
    const ext = raw.match(/\.(jpe?g|png|webp)$/i)?.[0].toLowerCase() ?? '.jpg'
    const stem = raw.replace(/\.[^.]*$/, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'wallpaper'
    const file = `${stem}${ext}`
    const isWindows = Boolean(await $.env.get('LOCALAPPDATA'))
    local = `${await claudeDir($)}/mantle/wallpapers/${file}`
    if (isWindows) local = local.replaceAll('/', '\\')
    const got = await $.process.run(['curl', '-L', '--fail', '--silent', '--show-error', '--create-dirs', '-o', local, target], { timeoutMs: 180_000 })
    if (got.exitCode !== 0) return [`Could not download the wallpaper: ${got.stderr.trim() || `curl exited ${got.exitCode}`}`]
  } else {
    if (!(await $.fs.exists(target))) return [`No image at ${target}.`]
    web = target
  }
  await setConfig($, c => ({ ...c, terminal: { ...c.terminal, wallpaper: local }, web: { ...c.web, wallpaper: web } }))
  await applyAll($)
  await $.store.set('applied', true)
  return [`Wallpaper set: ${local}`, ...(await read($, log)).slice(-3)]
}

// ---- live state -------------------------------------------------------------

async function writeLive($: $): Promise<void> {
  const c = await read($, config)
  if (!c.reactive || !c.targets.code || !(await $.store.get('applied'))) return
  await writeCodeTheme($, c, await read($, live))
}

async function setLive($: $, state: MantleLive): Promise<void> {
  if ((await read($, live)) === state) return
  await update($, live, () => state)
  writeTimer?.cancel()
  writeTimer = $.clock.after(60, () => void writeLive($).catch(() => undefined))
}

async function flash($: $, state: MantleLive, ms: number): Promise<void> {
  await setLive($, state)
  settleTimer?.cancel()
  settleTimer = $.clock.after(ms, () => void setLive($, rest()).catch(() => undefined))
}

// ---- the hooks ----------------------------------------------------------------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Register first: a prompt that arrives while the rest of start-up runs
    // (headless `claude -p "/mantle ..."`) must already find the command.
    await $.command.register({
      name: COMMAND,
      description: 'Mantle theme studio: one theme for Claude Code, Windows Terminal and claude.ai',
      argumentHint: '[apply | <preset> | doctor | wallpaper <url|file|off> | open | shortcut on|off | live on|off | terminal everywhere|follow on|off]',
    })
    await update($, config, () => withDefaults(undefined))
    const stored = await $.store.get('config')
    if (stored) await update($, config, () => withDefaults(stored))
    const c = await read($, config)
    const applied = Boolean(await $.store.get('applied'))
    if (c.targets.code && applied) await writeCodeTheme($, c, 'idle').catch(() => undefined)
    // Claude just started in this tab: put the wallpaper behind it.
    if (c.targets.terminal && applied && c.terminal.follow && (await markActive($, true).catch(() => false))) {
      await applyTerminal($, c).catch(() => undefined)
    }

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    settleTimer?.cancel()
    writeTimer?.cancel()
    const c = await read($, config)
    const applied = Boolean(await $.store.get('applied'))
    if (c.reactive && c.targets.code && applied) {
      await writeCodeTheme($, c, 'idle').catch(() => undefined)
    }
    // Claude is quitting: take the wallpaper off this tab (other Claude tabs keep theirs).
    if (c.targets.terminal && applied && c.terminal.follow && (await markActive($, false).catch(() => false))) {
      await applyTerminal($, c).catch(() => undefined)
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const args = (e.args ?? '').trim()
    const [word, value] = args.split(/\s+/)
    if (word === 'apply') {
      await applyAll($)
      await $.store.set('applied', true)
      return { text: (await read($, log)).slice(-4).join('\n') }
    }
    if (word === 'live') {
      const isOn = value !== 'off'
      await setConfig($, c => ({ ...c, reactive: isOn }))
      return { text: `Live reactions ${isOn ? 'on' : 'off'}.` }
    }
    if (word === 'wallpaper') {
      const lines = await setWallpaper($, args.slice(word.length).trim())
      return { text: lines.join('\n') }
    }
    if (word === 'open') return { text: await openClaudeTab($) }
    if (word === 'doctor') {
      const r = await $.process.run(['node', `${$.plugin.root}/skills/mantle-doctor/scripts/doctor.mjs`, await $.session.cwd()], { timeoutMs: 60_000 })
      return { text: r.exitCode === 0 ? r.stdout.trim() : `Mantle doctor could not run (${r.stderr.trim() || `exit ${r.exitCode}`}). It needs Node.js on your PATH.` }
    }
    if (word === 'shortcut') return { text: (await setShortcut($, value !== 'off')).join('\n') }
    if (word === 'terminal' && value === 'follow') {
      const isOn = args.split(/\s+/)[2] === 'on'
      await setConfig($, c => ({ ...c, terminal: { ...c.terminal, follow: isOn } }))
      await applyAll($)
      return { text: isOn ? 'While Claude runs, every tab of its profile shows the wallpaper.' : 'Other tabs stay plain while Claude runs.' }
    }
    if (word === 'terminal' && value === 'everywhere') {
      const isOn = args.split(/\s+/)[2] === 'on'
      await setConfig($, c => ({ ...c, terminal: { ...c.terminal, everywhere: isOn } }))
      await applyAll($)
      return {
        text: isOn
          ? 'Your own terminal profile now gets the wallpaper and colors too (every folder, Claude or not). Undo with /mantle terminal everywhere off.'
          : 'Only the "Claude · Mantle" profile has the wallpaper now; your other profiles are back to their own look. Restart Windows Terminal to see it.',
      }
    }
    const preset = PALETTES.find(p => p.id === word || p.name.toLowerCase() === args.toLowerCase())
    if (preset) {
      const c = await setConfig($, x => ({ ...x, preset: preset.id }))
      await applyAll($)
      await $.store.set('applied', true)
      return { text: `Mantle: ${preset.name} applied to ${Object.entries(c.targets).filter(([, v]) => v).map(([k]) => k).join(', ')}.` }
    }
    if (word) return { text: `Unknown preset "${word}". Presets: ${PALETTES.map(p => p.id).join(', ')}.` }
    await $.ui.open({ id: PANE, title: 'Mantle theme studio' })

    return { text: 'Mantle studio opened.' }
  }).catch(() => ({ text: 'Mantle hit an error; run with --debug for the details.' }))

  on('classic.UserPromptSubmit', async ($, e, next) => {
    isPlan = e.permission_mode === 'plan'

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      settleTimer?.cancel()
      await setLive($, 'thinking')
    }

    return next(e)
  })

  // Coloring is a side effect: nothing here may hold up or change the call.
  on('tool.call', async ($, e, next) => {
    inFlight++
    await setLive($, 'working').catch(() => undefined)
    try {
      const result = await next(e)
      if (e.tool === 'ExitPlanMode' && !result.deny) isPlan = false
      if (e.tool === 'EnterPlanMode' && !result.deny) isPlan = true
      return result
    } finally {
      inFlight = Math.max(0, inFlight - 1)
      if (inFlight === 0) await setLive($, 'thinking').catch(() => undefined)
    }
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const answered = await next(e)
    if (e.agentId !== undefined) return answered
    inFlight = 0
    if (e.reason === 'error' || e.reason === 'refusal') await flash($, 'error', 5000)
    else if (e.reason === 'answer') await flash($, 'done', 2500)
    else await setLive($, rest())

    return answered
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const c = await read($, config)
    const state = await read($, live)
    const lines = await read($, log)
    const current = await read($, tab)
    const p = paletteById(c.preset)

    if (e.surface === 'mobile') {
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          <Text bold>Mantle · {p.name}</Text>
          <Text dimColor>Open the studio on desktop or in the terminal to edit it.</Text>
        </Box>
      )
    }
    const { Box, Text, Button, Select, Input } = $.ui.resolve(e)

    const presetOptions = PALETTES.map(x => ({ value: x.id, label: `${x.name}${x.mode === 'light' ? ' (light)' : ''}` }))
    const sameOptions = [{ value: '', label: 'Same as main' }, ...presetOptions]
    const pct = (list: number[]) => list.map(n => ({ value: String(n), label: `${n}%` }))

    const swatch = (pal: Palette) => (
      <Box flexDirection="row">
        {[pal.bg, pal.surface, pal.accent, pal.accent2, pal.info, pal.success, pal.warning, pal.error].map(color => (
          <Text backgroundColor={color}>{'   '}</Text>
        ))}
      </Box>
    )

    const toggle = (key: keyof MantleConfig['targets'], label: string) => (
      <Button
        key={`target-${key}`}
        onPress={() => setConfig($, x => ({ ...x, targets: { ...x.targets, [key]: !x.targets[key] } }))}
      >
        {c.targets[key] ? '● ' : '○ '}{label}
      </Button>
    )

    const hexInput = (key: string, label: string, value: string, write: (v: string) => (x: MantleConfig) => MantleConfig) => (
      <Input
        key={key}
        label={label}
        value={value}
        placeholder="palette default (#rrggbb)"
        submitLabel="save"
        onSubmit={async v => {
          const text = v.trim()
          if (text !== '' && !isHex(text)) return say($, `${label}: "${text}" is not a #hex color.`)
          await setConfig($, write(text))
          await say($, `${label}: ${text || 'palette default'}.`)
        }}
      />
    )

    const tabButton = (id: string, label: string) => (
      <Button key={`tab-${id}`} variant={current === id ? 'primary' : 'secondary'} onPress={() => update($, tab, () => id)}>
        {label}
      </Button>
    )

    const codeTab = (
      <Box flexDirection="column" gap={1}>
        <Select
          key="code-preset"
          label="Preset"
          options={sameOptions}
          value={c.code.preset}
          onSelect={v => setConfig($, x => ({ ...x, code: { ...x.code, preset: v } }))}
        />
        {hexInput('code-accent', 'Idle accent', c.code.accent, v => x => ({ ...x, code: { ...x.code, accent: v } }))}
        {hexInput('code-thinking', 'Thinking color', c.code.thinking, v => x => ({ ...x, code: { ...x.code, thinking: v } }))}
        {hexInput('code-working', 'Tool-running color', c.code.working, v => x => ({ ...x, code: { ...x.code, working: v } }))}
        {hexInput('code-message', 'Your message background', c.code.messageBg, v => x => ({ ...x, code: { ...x.code, messageBg: v } }))}
      </Box>
    )

    const terminalTab = (
      <Box flexDirection="column" gap={1}>
        <Select
          key="term-preset"
          label="Preset"
          options={sameOptions}
          value={c.terminal.preset}
          onSelect={v => setConfig($, x => ({ ...x, terminal: { ...x.terminal, preset: v } }))}
        />
        <Input
          key="term-wallpaper"
          label="Wallpaper image path"
          value={c.terminal.wallpaper}
          placeholder="C:\\Users\\you\\Pictures\\wall.jpg"
          submitLabel="save"
          onSubmit={v => setConfig($, x => ({ ...x, terminal: { ...x.terminal, wallpaper: v.trim().replace(/^"|"$/g, '') } }))}
        />
        <Select
          key="term-image-opacity"
          label="Wallpaper strength"
          options={pct([10, 20, 30, 40, 50, 70, 100])}
          value={String(c.terminal.imageOpacity)}
          onSelect={v => setConfig($, x => ({ ...x, terminal: { ...x.terminal, imageOpacity: Number(v) } }))}
        />
        <Select
          key="term-opacity"
          label="Window opacity"
          options={pct([60, 70, 80, 85, 90, 100])}
          value={String(c.terminal.opacity)}
          onSelect={v => setConfig($, x => ({ ...x, terminal: { ...x.terminal, opacity: Number(v) } }))}
        />
        <Button
          key="term-acrylic"
          onPress={() => setConfig($, x => ({ ...x, terminal: { ...x.terminal, acrylic: !x.terminal.acrylic } }))}
        >
          {c.terminal.acrylic ? '● ' : '○ '}Acrylic blur
        </Button>
        <Input
          key="term-font"
          label="Font"
          value={c.terminal.font}
          submitLabel="save"
          onSubmit={v => setConfig($, x => ({ ...x, terminal: { ...x.terminal, font: v.trim() } }))}
        />
        {hexInput('term-bg', 'Background override', c.terminal.background, v => x => ({ ...x, terminal: { ...x.terminal, background: v } }))}
      </Box>
    )

    const webTab = (
      <Box flexDirection="column" gap={1}>
        <Select
          key="web-preset"
          label="Preset"
          options={sameOptions}
          value={c.web.preset}
          onSelect={v => setConfig($, x => ({ ...x, web: { ...x.web, preset: v } }))}
        />
        <Input
          key="web-wallpaper"
          label="Wallpaper (path or https URL)"
          value={c.web.wallpaper}
          placeholder="empty: same as terminal"
          submitLabel="save"
          onSubmit={v => setConfig($, x => ({ ...x, web: { ...x.web, wallpaper: v.trim().replace(/^"|"$/g, '') } }))}
        />
        <Select
          key="web-blur"
          label="Wallpaper blur"
          options={[0, 2, 4, 6, 10, 16].map(n => ({ value: String(n), label: `${n}px` }))}
          value={String(c.web.blur)}
          onSelect={v => setConfig($, x => ({ ...x, web: { ...x.web, blur: Number(v) } }))}
        />
        <Select
          key="web-dim"
          label="Wallpaper dim"
          options={pct([0, 15, 25, 35, 50, 65])}
          value={String(c.web.dim)}
          onSelect={v => setConfig($, x => ({ ...x, web: { ...x.web, dim: Number(v) } }))}
        />
        <Select
          key="web-panels"
          label="Panel opacity"
          options={pct([50, 65, 78, 88, 100])}
          value={String(c.web.panelOpacity)}
          onSelect={v => setConfig($, x => ({ ...x, web: { ...x.web, panelOpacity: Number(v) } }))}
        />
        {hexInput('web-accent', 'Accent override', c.web.accent, v => x => ({ ...x, web: { ...x.web, accent: v } }))}
        <Button
          key="web-reactive"
          onPress={() => setConfig($, x => ({ ...x, web: { ...x.web, reactive: !x.web.reactive } }))}
        >
          {c.web.reactive ? '● ' : '○ '}Glow while Claude responds
        </Button>
        <Button
          key="web-install"
          onPress={async () => say($, `Extension files written to ${await installExtension($)}.`)}
        >
          Reinstall extension files
        </Button>
      </Box>
    )

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold color={p.accent}>✦ Mantle</Text>
          <Text dimColor>One theme for Claude Code, Windows Terminal and claude.ai.</Text>
        </Box>
        <Select
          key="preset"
          label="Main preset"
          options={presetOptions}
          value={c.preset}
          onSelect={async v => {
            const next = await setConfig($, x => ({ ...x, preset: v }))
            if (next.targets.code) {
              await writeCodeTheme($, next, await read($, live))
              await say($, `Previewing ${paletteById(v).name} in Claude Code. Apply everywhere to sync the rest.`)
            }
          }}
        />
        {swatch(p)}
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          {toggle('code', 'Claude Code')}
          {toggle('terminal', 'Windows Terminal')}
          {toggle('web', 'claude.ai')}
        </Box>
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          <Button key="reactive" onPress={() => setConfig($, x => ({ ...x, reactive: !x.reactive }))}>
            {c.reactive ? '● ' : '○ '}Live reactions
          </Button>
          <Text dimColor>now: {c.reactive ? state : 'off'}</Text>
        </Box>
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          {tabButton('code', 'Claude Code')}
          {tabButton('terminal', 'Terminal')}
          {tabButton('web', 'claude.ai')}
        </Box>
        {current === 'terminal' ? terminalTab : current === 'web' ? webTab : codeTab}
        <Button
          key="apply"
          variant="primary"
          onPress={async () => {
            await applyAll($)
            await $.store.set('applied', true)
          }}
        >
          Apply everywhere
        </Button>
        <Box flexDirection="column">
          {lines.map(line => (
            <Text dimColor>{line}</Text>
          ))}
        </Box>
      </Box>
    )
  })
}
