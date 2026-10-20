// Mantle palettes: one palette drives every surface (Claude Code, Windows
// Terminal, claude.ai). Shared verbatim by the mod and the browser extension.

export const PALETTES = [
  {
    id: 'ember', name: 'Ember', mode: 'dark',
    bg: '#1a1614', surface: '#241e1b', surfaceAlt: '#2e2622', text: '#f2e9e1', muted: '#a39184', border: '#3d332d',
    accent: '#d97757', accent2: '#e8a87c', success: '#8fbf7f', error: '#e5604d', warning: '#e8b04b', info: '#7fb3d5',
    ansi: ['#2a2320', '#e5604d', '#8fbf7f', '#e8b04b', '#7fb3d5', '#c38fbf', '#7fc4b8', '#e8ddd3',
      '#5a4c43', '#f07a68', '#a6d496', '#f2c46b', '#9cc8e6', '#d6a7d2', '#99d6cb', '#fff8f1'],
  },
  {
    id: 'aurora', name: 'Aurora', mode: 'dark',
    bg: '#0b1220', surface: '#121b2e', surfaceAlt: '#18233a', text: '#e6f1ff', muted: '#8796b0', border: '#24324d',
    accent: '#5eead4', accent2: '#a78bfa', success: '#4ade80', error: '#f87171', warning: '#fbbf24', info: '#60a5fa',
    ansi: ['#16213a', '#f87171', '#4ade80', '#fbbf24', '#60a5fa', '#c084fc', '#5eead4', '#cbd5e1',
      '#3b4a66', '#fca5a5', '#86efac', '#fde68a', '#93c5fd', '#d8b4fe', '#99f6e4', '#f8fafc'],
  },
  {
    id: 'synthwave', name: 'Synthwave', mode: 'dark',
    bg: '#1a1033', surface: '#241446', surfaceAlt: '#2e1a57', text: '#f8f0ff', muted: '#a58ccf', border: '#3d2766',
    accent: '#ff4fd8', accent2: '#36f9f6', success: '#72f1b8', error: '#fe4450', warning: '#fede5d', info: '#7b9cff',
    ansi: ['#2a1a4d', '#fe4450', '#72f1b8', '#fede5d', '#7b9cff', '#ff7edb', '#36f9f6', '#e8dcff',
      '#5a4387', '#ff6b77', '#9cf7cf', '#fff08a', '#a3b9ff', '#ffa3e8', '#7dfcfa', '#ffffff'],
  },
  {
    id: 'tokyo', name: 'Tokyo Night', mode: 'dark',
    bg: '#1a1b26', surface: '#1f2335', surfaceAlt: '#24283b', text: '#c0caf5', muted: '#737aa2', border: '#2f3549',
    accent: '#7aa2f7', accent2: '#bb9af7', success: '#9ece6a', error: '#f7768e', warning: '#e0af68', info: '#7dcfff',
    ansi: ['#15161e', '#f7768e', '#9ece6a', '#e0af68', '#7aa2f7', '#bb9af7', '#7dcfff', '#a9b1d6',
      '#414868', '#f7768e', '#9ece6a', '#e0af68', '#7aa2f7', '#bb9af7', '#7dcfff', '#c0caf5'],
  },
  {
    id: 'mocha', name: 'Catppuccin Mocha', mode: 'dark',
    bg: '#1e1e2e', surface: '#313244', surfaceAlt: '#45475a', text: '#cdd6f4', muted: '#a6adc8', border: '#45475a',
    accent: '#cba6f7', accent2: '#f5c2e7', success: '#a6e3a1', error: '#f38ba8', warning: '#f9e2af', info: '#89b4fa',
    ansi: ['#45475a', '#f38ba8', '#a6e3a1', '#f9e2af', '#89b4fa', '#f5c2e7', '#94e2d5', '#bac2de',
      '#585b70', '#f38ba8', '#a6e3a1', '#f9e2af', '#89b4fa', '#f5c2e7', '#94e2d5', '#a6adc8'],
  },
  {
    id: 'rosepine', name: 'Rosé Pine', mode: 'dark',
    bg: '#191724', surface: '#1f1d2e', surfaceAlt: '#26233a', text: '#e0def4', muted: '#908caa', border: '#403d52',
    accent: '#ebbcba', accent2: '#c4a7e7', success: '#9ccfd8', error: '#eb6f92', warning: '#f6c177', info: '#56949f',
    ansi: ['#26233a', '#eb6f92', '#9ccfd8', '#f6c177', '#31748f', '#c4a7e7', '#ebbcba', '#e0def4',
      '#6e6a86', '#eb6f92', '#9ccfd8', '#f6c177', '#31748f', '#c4a7e7', '#ebbcba', '#e0def4'],
  },
  {
    id: 'nord', name: 'Nord Night', mode: 'dark',
    bg: '#2e3440', surface: '#3b4252', surfaceAlt: '#434c5e', text: '#eceff4', muted: '#9aa5b8', border: '#4c566a',
    accent: '#88c0d0', accent2: '#b48ead', success: '#a3be8c', error: '#bf616a', warning: '#ebcb8b', info: '#81a1c1',
    ansi: ['#3b4252', '#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1', '#b48ead', '#88c0d0', '#e5e9f0',
      '#4c566a', '#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1', '#b48ead', '#8fbcbb', '#eceff4'],
  },
  {
    id: 'forest', name: 'Forest', mode: 'dark',
    bg: '#10170f', surface: '#172116', surfaceAlt: '#1e2a1c', text: '#e4efd9', muted: '#8fa385', border: '#2c3b29',
    accent: '#9ccc65', accent2: '#e6c36a', success: '#81c784', error: '#e57373', warning: '#ffb74d', info: '#4fc3f7',
    ansi: ['#1c2a1a', '#e57373', '#9ccc65', '#e6c36a', '#4fc3f7', '#ce93d8', '#80cbc4', '#d7e3cc',
      '#3d5238', '#ef9a9a', '#c5e1a5', '#fff59d', '#81d4fa', '#e1bee7', '#b2dfdb', '#f4f9ef'],
  },
  {
    id: 'ocean', name: 'Deep Ocean', mode: 'dark',
    bg: '#071a24', surface: '#0c2533', surfaceAlt: '#113041', text: '#e0f4ff', muted: '#7fa3b8', border: '#1b3f52',
    accent: '#38bdf8', accent2: '#2dd4bf', success: '#4ade80', error: '#fb7185', warning: '#facc15', info: '#818cf8',
    ansi: ['#0f2a38', '#fb7185', '#4ade80', '#facc15', '#38bdf8', '#c084fc', '#2dd4bf', '#cbe6f2',
      '#2f566b', '#fda4af', '#86efac', '#fde047', '#7dd3fc', '#d8b4fe', '#5eead4', '#f0fbff'],
  },
  {
    id: 'paper', name: 'Paper', mode: 'light',
    bg: '#faf7f0', surface: '#f0ebe0', surfaceAlt: '#e6dfd0', text: '#2b2620', muted: '#7a7064', border: '#d6cdbb',
    accent: '#c2410c', accent2: '#7c3aed', success: '#15803d', error: '#b91c1c', warning: '#b45309', info: '#1d4ed8',
    ansi: ['#2b2620', '#b91c1c', '#15803d', '#b45309', '#1d4ed8', '#7c3aed', '#0f766e', '#d6cdbb',
      '#7a7064', '#dc2626', '#16a34a', '#d97706', '#2563eb', '#8b5cf6', '#0d9488', '#faf7f0'],
  },
]

export const LIVE_STATES = ['idle', 'thinking', 'working', 'plan', 'done', 'error']

export function paletteById(id) {
  return PALETTES.find(p => p.id === id) ?? PALETTES[0]
}

// ---- color math -----------------------------------------------------------

export function isHex(value) {
  return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

function rgb(hex) {
  let h = hex.trim().slice(1)
  if (h.length === 3) h = [...h].map(c => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
}

// `mix(a, b, t)`: t = 0 is a, t = 1 is b.
export function mix(a, b, t) {
  const x = rgb(a)
  const y = rgb(b)
  return toHex(x.map((v, i) => v + (y[i] - v) * t))
}

export function lighten(hex, t) {
  return mix(hex, '#ffffff', t)
}

export function darken(hex, t) {
  return mix(hex, '#000000', t)
}

// "h s% l%" triplet, the format claude.ai's legacy --bg-*/--text-* vars hold.
export function hslTriplet(hex) {
  const [r, g, b] = rgb(hex).map(v => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return `${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`
}

// ---- live state -----------------------------------------------------------

// The color a live state paints the accent and prompt border.
export function stateColor(p, state) {
  switch (state) {
    case 'thinking': return p.accent2
    case 'working': return p.info
    case 'plan': return p.warning
    case 'done': return p.success
    case 'error': return p.error
    default: return p.accent
  }
}

// ---- Claude Code ----------------------------------------------------------

// A ~/.claude/themes/<slug>.json theme. `custom` holds per-token overrides
// the person set for Claude Code alone; `state` recolors the live accents.
export function claudeCodeTheme(p, { state = 'idle', custom = {}, name } = {}) {
  const live = stateColor(p, state)
  const dark = p.mode === 'dark'
  const wash = (c, t) => mix(c, p.bg, t)
  const overrides = {
    claude: live,
    claudeShimmer: lighten(live, 0.35),
    text: p.text,
    inverseText: p.bg,
    inactive: p.muted,
    inactiveShimmer: lighten(p.muted, 0.3),
    subtle: p.border,
    suggestion: p.accent2,
    remember: p.accent2,
    permission: p.info,
    permissionShimmer: lighten(p.info, 0.3),
    success: p.success,
    error: p.error,
    warning: p.warning,
    warningShimmer: lighten(p.warning, 0.3),
    merged: p.accent2,
    promptBorder: state === 'idle' ? mix(p.accent, p.border, 0.45) : live,
    promptBorderShimmer: lighten(live, 0.3),
    planMode: p.warning,
    autoAccept: p.success,
    bashBorder: p.warning,
    ide: p.info,
    fastMode: p.warning,
    fastModeShimmer: lighten(p.warning, 0.3),
    diffAdded: wash(p.success, dark ? 0.72 : 0.8),
    diffRemoved: wash(p.error, dark ? 0.72 : 0.8),
    diffAddedDimmed: wash(p.success, 0.88),
    diffRemovedDimmed: wash(p.error, 0.88),
    diffAddedWord: wash(p.success, dark ? 0.45 : 0.6),
    diffRemovedWord: wash(p.error, dark ? 0.45 : 0.6),
    userMessageBackground: p.surface,
    userMessageBackgroundHover: p.surfaceAlt,
    bashMessageBackgroundColor: wash(p.warning, 0.88),
    memoryBackgroundColor: wash(p.accent2, 0.88),
    selectionBg: wash(p.accent, 0.6),
    composerSidebarBackground: p.surface,
    rate_limit_fill: live,
    rate_limit_empty: p.border,
    briefLabelYou: p.info,
    briefLabelClaude: live,
  }
  for (const [token, value] of Object.entries(custom)) {
    if (isHex(value)) overrides[token] = value
  }
  return { name: name ?? `Mantle · ${p.name}`, base: dark ? 'dark' : 'light', overrides }
}

// ---- Windows Terminal -----------------------------------------------------

const ANSI_KEYS = ['black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightPurple', 'brightCyan', 'brightWhite']

export function terminalScheme(p, { background } = {}) {
  const scheme = {
    name: `Mantle ${p.name}`,
    background: isHex(background) ? background : p.bg,
    foreground: p.text,
    cursorColor: p.accent,
    selectionBackground: mix(p.accent, p.bg, 0.55),
  }
  ANSI_KEYS.forEach((key, i) => { scheme[key] = p.ansi[i] })
  return scheme
}

// ---- claude.ai --------------------------------------------------------------

// CSS custom properties claude.ai reads (the --cds-* design tokens, plus the
// legacy HSL-triplet --bg-*/--text-* ones some components still use).
export function webVars(p, { accent } = {}) {
  const a = isHex(accent) ? accent : p.accent
  const vars = {
    '--cds-page-bg': p.bg,
    '--cds-surface-0': darken(p.bg, 0.15),
    '--cds-surface-1': p.bg,
    '--cds-surface-2': p.surface,
    '--cds-surface-3': p.surfaceAlt,
    '--cds-surface-panel': p.surface,
    '--cds-surface-popover': p.surfaceAlt,
    '--cds-tooltip-bg': p.surfaceAlt,
    '--cds-text-primary': p.text,
    '--cds-text-secondary': mix(p.text, p.muted, 0.45),
    '--cds-text-muted': p.muted,
    '--cds-text-accent': a,
    '--cds-text-danger': p.error,
    '--cds-text-success': p.success,
    '--cds-text-warning': p.warning,
    '--cds-border': mix(p.border, p.bg, 0.1),
    '--cds-border-strong': mix(p.border, p.text, 0.2),
    '--cds-border-accent': mix(a, p.bg, 0.4),
    '--cds-fill-accent': a,
    '--cds-fill-accent-hover': lighten(a, 0.12),
    '--cds-role-accent-fill': a,
    '--cds-role-accent-fill-hover': lighten(a, 0.12),
    '--cds-bg-accent': mix(a, p.bg, 0.8),
    '--cds-on-accent': p.mode === 'dark' ? p.bg : '#ffffff',
    // Spelled out so they never resolve through the neutrals a wallpaper clears.
    '--cds-fill-primary': p.text,
    '--cds-fill-primary-hover': mix(p.text, p.muted, 0.25),
    '--cds-on-primary': p.bg,
    '--bg-000': hslTriplet(p.surfaceAlt),
    '--bg-100': hslTriplet(p.bg),
    '--bg-200': hslTriplet(p.surface),
    '--bg-300': hslTriplet(p.surfaceAlt),
    '--bg-400': hslTriplet(darken(p.bg, 0.2)),
    '--bg-500': hslTriplet(darken(p.bg, 0.3)),
    '--text-000': hslTriplet(p.text),
    '--text-100': hslTriplet(p.text),
    '--text-200': hslTriplet(mix(p.text, p.muted, 0.45)),
    '--text-300': hslTriplet(mix(p.text, p.muted, 0.6)),
    '--text-400': hslTriplet(p.muted),
    '--text-500': hslTriplet(p.muted),
    '--border-100': hslTriplet(p.border),
    '--border-200': hslTriplet(p.border),
    '--border-300': hslTriplet(p.border),
    '--border-400': hslTriplet(p.border),
    '--accent-brand': hslTriplet(a),
    '--brand-100': hslTriplet(a),
    '--brand-200': hslTriplet(a),
  }
  for (const [step, color] of neutralRamp(p)) vars[`--cds-neutral-${step}`] = color
  ALPHA_STEPS.forEach((pct, i) => { vars[`--cds-alpha-${i}`] = `hsl(from ${p.text} h s l / ${pct}%)` })
  vars['--cds-fill-ghost-hover'] = `hsl(from ${p.text} h s l / 7.5%)`
  vars['--cds-fill-ghost-selected'] = `hsl(from ${p.text} h s l / 15%)`
  return vars
}

const ALPHA_STEPS = [0, 5, 10, 20, 35, 50, 60, 70, 85, 95]

// claude.ai's --cds-neutral-<step> scale runs from the page's deepest shade
// (0) to its brightest (900); steps 0..100 hold the surfaces.
export const NEUTRAL_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 350, 400, 450,
  500, 550, 600, 650, 700, 750, 800, 810, 820, 830, 840, 850, 860, 870, 880, 890, 900]

export function neutralRamp(p) {
  const anchors = [
    [0, darken(p.bg, 0.3)],
    [50, p.bg],
    [100, p.surfaceAlt],
    [300, mix(p.border, p.muted, 0.5)],
    [500, p.muted],
    [850, p.text],
    [900, p.mode === 'dark' ? '#ffffff' : '#000000'],
  ]
  return NEUTRAL_STEPS.map(step => {
    const hi = anchors.findIndex(([at]) => at >= step)
    const [at1, c1] = anchors[hi]
    if (at1 === step || hi === 0) return [step, c1]
    const [at0, c0] = anchors[hi - 1]
    return [step, mix(c0, c1, (step - at0) / (at1 - at0))]
  })
}
