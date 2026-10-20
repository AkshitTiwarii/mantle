export type Palette = {
  id: string
  name: string
  mode: 'dark' | 'light'
  bg: string
  surface: string
  surfaceAlt: string
  text: string
  muted: string
  border: string
  accent: string
  accent2: string
  success: string
  error: string
  warning: string
  info: string
  ansi: string[]
}

export type LiveState = 'idle' | 'thinking' | 'working' | 'plan' | 'done' | 'error'

export type ClaudeCodeTheme = {
  name: string
  base: 'dark' | 'light'
  overrides: Record<string, string>
}

export const PALETTES: Palette[]
export const LIVE_STATES: LiveState[]
export function paletteById(id: string): Palette
export function isHex(value: unknown): value is string
export function mix(a: string, b: string, t: number): string
export function lighten(hex: string, t: number): string
export function darken(hex: string, t: number): string
export function hslTriplet(hex: string): string
export function stateColor(p: Palette, state: LiveState): string
export function claudeCodeTheme(
  p: Palette,
  options?: { state?: LiveState; custom?: Record<string, string>; name?: string },
): ClaudeCodeTheme
export function terminalScheme(p: Palette, options?: { background?: string }): Record<string, string>
export function webVars(p: Palette, options?: { accent?: string }): Record<string, string>
