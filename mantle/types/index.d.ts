export type MantleTargets = { code: boolean; terminal: boolean; web: boolean }

// An empty string means "use the palette's own value" (or, for `preset`,
// "same as the main preset").
export type MantleCodeConfig = {
  preset: string
  accent: string
  thinking: string
  working: string
  messageBg: string
}

export type MantleTerminalConfig = {
  preset: string
  wallpaper: string
  imageOpacity: number
  opacity: number
  acrylic: boolean
  font: string
  background: string
  /** Windows Terminal profiles (GUIDs) Mantle also themes, besides its own: the ones you ran /mantle from. */
  profiles: string[]
}

export type MantleWebConfig = {
  preset: string
  wallpaper: string
  blur: number
  dim: number
  panelOpacity: number
  accent: string
  reactive: boolean
}

export type MantleConfig = {
  preset: string
  targets: MantleTargets
  reactive: boolean
  code: MantleCodeConfig
  terminal: MantleTerminalConfig
  web: MantleWebConfig
}

export type MantleLive = 'idle' | 'thinking' | 'working' | 'plan' | 'done' | 'error'

declare module 'claude-code' {
  interface PluginState {
    mantle: {
      config: MantleConfig
      tab: string
      live: MantleLive
      log: string[]
    }
  }
}
