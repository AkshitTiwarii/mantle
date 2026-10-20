import type { Palette } from './palettes.js'

// Shapes returned by the local companion (server/scan.mjs). Every value is
// already redacted server-side.
export type LocalPlugin = {
  id: string
  name: string
  marketplace?: string
  version?: string
  description?: string
  enabled?: boolean
  origin: 'marketplace' | 'account'
  scope?: string
  installedAt?: string
  missing?: boolean
  skills: string[]
  commands: string[]
  agents: string[]
  hooks?: boolean
  connectors: string[]
}

export type LocalSkill = { name: string; description?: string; source: 'personal' | 'account' | 'plugin'; origin?: string; path?: string }

export type LocalConnector = {
  name: string
  transport: string
  command?: string
  args: string[]
  url?: string
  env?: Record<string, string>
  headers?: Record<string, string>
  hasOAuth: boolean
  disabled?: boolean
  scope: 'user' | 'local' | 'settings' | 'plugin'
  origin: string
}

export type LocalTheme = {
  slug: string
  file: string
  name: string
  base?: string
  valid: boolean
  active: boolean
  isMantle: boolean
  swatch: string[]
  tokenCount: number
}

export type LocalMarketplace = { name: string; source?: string; repo?: string; lastUpdated?: string; inSettings: boolean; cloned: boolean }

export type MantleStatus = {
  studio?: { file: string; preset?: string; reactive?: boolean; targets?: Record<string, boolean>; codePreset?: string; terminalPreset?: string; webPreset?: string }
  code: { file: string; missing?: boolean; name?: string; base?: string; selected: boolean; accent?: string }
  web: { file: string; missing?: boolean; palette?: string; wallpaper?: string; reactive?: boolean; updatedAt?: number }
  terminal: { file?: string; missing?: boolean; profile?: string; scheme?: string; acrylic?: boolean; wallpaper?: boolean }
}

export type LocalScan = {
  generatedAt: string
  claudeDir: string
  activeTheme?: string
  model?: string
  plugins: LocalPlugin[]
  skills: LocalSkill[]
  connectors: LocalConnector[]
  themes: LocalTheme[]
  marketplaces: LocalMarketplace[]
  mantle: MantleStatus
  warnings: string[]
}

export type ThemeFile = { file: string; exists: boolean; name?: string; canUndo: boolean }

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: 'no-store', ...init })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body as T
}

const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  health: () => call<{ ok: boolean; version: string; claudeDir: string }>('/api/health'),
  local: () => call<LocalScan>('/api/local'),
  themeFile: () => call<ThemeFile>('/api/mantle-theme'),
  apply: (target: { paletteId: string } | { palette: Palette }) =>
    call<{ ok: true; file: string; palette: string; replaced: string | null; canUndo: boolean }>('/api/apply-theme', post({ confirm: true, ...target })),
  undo: () => call<{ ok: true; file: string }>('/api/undo-theme', post({ confirm: true })),
}
