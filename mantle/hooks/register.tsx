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
  terminal: { preset: '', wallpaper: '', imageOpacity: 30, opacity: 85, acrylic: true, font: 'Cascadia Code', background: '' },
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

export function terminalFragment(c: MantleConfig) {
  const p = paletteById(c.terminal.preset || c.preset)
  const custom = isHex(c.terminal.background)
  const own = terminalScheme(p, { background: c.terminal.background })
  if (custom) own.name = 'Mantle Custom'
  const schemes = PALETTES.map(x => terminalScheme(x))
  if (custom) schemes.push(own)
  const profile: Record<string, unknown> = {
    guid: PROFILE_GUID,
    name: 'Claude · Mantle',
    commandline: 'powershell.exe -NoLogo -NoExit -Command claude',
    startingDirectory: '%USERPROFILE%',
    colorScheme: own.name,
    tabColor: p.accent,
    cursorShape: 'bar',
    opacity: c.terminal.opacity,
    useAcrylic: c.terminal.acrylic,
    font: { face: c.terminal.font || 'Cascadia Code' },
  }
  if (c.terminal.wallpaper) {
    profile.backgroundImage = c.terminal.wallpaper
    profile.backgroundImageOpacity = c.terminal.imageOpacity / 100
    profile.backgroundImageStretchMode = 'uniformToFill'
  }
  return { profiles: [profile], schemes }
}

async function applyTerminal($: $, c: MantleConfig): Promise<string[]> {
  const local = await $.env.get('LOCALAPPDATA')
  if (!local) return ['Terminal: Windows Terminal sync needs Windows; skipped.']
  if (c.terminal.wallpaper && !(await $.fs.exists(c.terminal.wallpaper))) {
    return [`Terminal: wallpaper not found at ${c.terminal.wallpaper}.`]
  }
  const path = `${local}/Microsoft/Windows Terminal/Fragments/Mantle/mantle.json`
  await $.fs.write(path, JSON.stringify(terminalFragment(c), null, 2) + '\n')
  return ['Terminal: profile "Claude · Mantle" updated. Open it from the Windows Terminal tab menu (new window if it does not show yet).']
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
    : [`claude.ai: ${p.name} synced; open claude.ai tabs update within a few seconds.`]
}

async function applyAll($: $): Promise<void> {
  const c = await read($, config)
  const lines: string[] = []
  const failed = (label: string) => (err: Error) => [`${label}: failed (${err.message}).`]
  if (c.targets.code) lines.push(...(await applyCode($, c).catch(failed('Claude Code'))))
  if (c.targets.terminal) lines.push(...(await applyTerminal($, c).catch(failed('Terminal'))))
  if (c.targets.web) lines.push(...(await applyWeb($, c).catch(failed('claude.ai'))))
  if (lines.length === 0) lines.push('Every target is off: turn one on first.')
  await say($, lines)
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
    await update($, config, () => withDefaults(undefined))
    const stored = await $.store.get('config')
    if (stored) await update($, config, () => withDefaults(stored))
    await $.command.register({
      name: COMMAND,
      description: 'Mantle theme studio: one theme for Claude Code, Windows Terminal and claude.ai',
      argumentHint: '[apply | <preset> | live on|off]',
    })
    const c = await read($, config)
    if (c.targets.code && (await $.store.get('applied'))) await writeCodeTheme($, c, 'idle').catch(() => undefined)

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    settleTimer?.cancel()
    writeTimer?.cancel()
    const c = await read($, config)
    if (c.reactive && c.targets.code && (await $.store.get('applied'))) {
      await writeCodeTheme($, c, 'idle').catch(() => undefined)
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
