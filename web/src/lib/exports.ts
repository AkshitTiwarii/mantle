import { claudeCodeTheme, darken, isHex, lighten, mix, terminalScheme } from './palettes.js'
import type { Palette } from './palettes.js'

// The payload the Mantle claude.ai extension reads (mantle-theme.json); same
// shape the mod writes, minus the wallpaper the person picks locally.
export function webPayload(p: Palette) {
  return {
    version: 1,
    updatedAt: Date.now(),
    palette: p,
    accent: '',
    wallpaper: '',
    blur: 6,
    dim: 35,
    panelOpacity: 78,
    reactive: true,
  }
}

export type ExportKind = 'code' | 'terminal' | 'web' | 'palette'

export const EXPORTS: { kind: ExportKind; label: string; file: (p: Palette) => string; hint: string }[] = [
  {
    kind: 'code',
    label: 'Claude Code theme',
    file: p => `${slug(p.name)}.json`,
    hint: 'Save to ~/.claude/themes/, then pick it in /theme.',
  },
  {
    kind: 'terminal',
    label: 'Windows Terminal scheme',
    file: p => `${slug(p.name)}-scheme.json`,
    hint: 'Paste into "schemes" in Windows Terminal settings.json, then pick it for a profile.',
  },
  {
    kind: 'web',
    label: 'claude.ai extension payload',
    file: () => 'mantle-theme.json',
    hint: "Replace mantle-theme.json in the Mantle extension's folder; open tabs update within seconds.",
  },
  {
    kind: 'palette',
    label: 'Mantle palette',
    file: p => `${slug(p.name)}.mantle.json`,
    hint: 'The source palette every other export is generated from.',
  },
]

export function exportJson(kind: ExportKind, p: Palette): string {
  const value =
    kind === 'code'
      ? claudeCodeTheme(p)
      : kind === 'terminal'
        ? terminalScheme(p)
        : kind === 'web'
          ? webPayload(p)
          : p
  return JSON.stringify(value, null, 2) + '\n'
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme'
}

// ---- theme maker --------------------------------------------------------------

export type BaseColors = {
  name: string
  mode: 'dark' | 'light'
  bg: string
  text: string
  accent: string
  accent2: string
  success: string
  error: string
  warning: string
  info: string
}

export function baseFrom(p: Palette): BaseColors {
  const { name, mode, bg, text, accent, accent2, success, error, warning, info } = p
  return { name, mode, bg, text, accent, accent2, success, error, warning, info }
}

// Derive a full palette (surfaces, border, muted, 16 ANSI colors) from the
// handful of colors a person picks.
export function paletteFrom(b: BaseColors): Palette {
  const dark = b.mode === 'dark'
  const lift = (t: number) => (dark ? mix(b.bg, b.text, t) : mix(b.bg, b.text, t * 0.9))
  const surface = lift(0.05)
  const surfaceAlt = lift(0.1)
  const border = lift(0.17)
  const muted = mix(b.text, b.bg, 0.42)
  const purple = mix(b.accent2, b.error, 0.25)
  const cyan = mix(b.info, b.success, 0.5)
  const normal = [dark ? lift(0.08) : b.text, b.error, b.success, b.warning, b.info, purple, cyan, dark ? mix(b.text, b.bg, 0.12) : border]
  const bright = normal.map((c, i) =>
    i === 0 ? (dark ? lift(0.3) : muted) : i === 7 ? (dark ? lighten(b.text, 0.4) : b.bg) : dark ? lighten(c, 0.22) : darken(c, 0.12),
  )
  return {
    id: slug(b.name),
    name: b.name || 'Custom',
    mode: b.mode,
    bg: b.bg,
    surface,
    surfaceAlt,
    text: b.text,
    muted,
    border,
    accent: b.accent,
    accent2: b.accent2,
    success: b.success,
    error: b.error,
    warning: b.warning,
    info: b.info,
    ansi: [...normal, ...bright],
  }
}

export function validBase(b: BaseColors): boolean {
  return (['bg', 'text', 'accent', 'accent2', 'success', 'error', 'warning', 'info'] as const).every(k => isHex(b[k]))
}

// WCAG contrast ratio, to warn when text would be hard to read.
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = hex.replace('#', '')
    const full = h.length === 3 ? [...h].map(c => c + c).join('') : h
    const [r, g, bl] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

export function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
