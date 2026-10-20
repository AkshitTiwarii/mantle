// Mantle for claude.ai: recolors the page through its --cds-* design tokens,
// lays a wallpaper behind translucent panels, and glows while Claude responds.
// Settings live in chrome.storage.local under "mantle"; the Mantle studio in
// Claude Code writes mantle-theme.json beside this file, adopted when newer.

;(async () => {
  const { paletteById, webVars } = await import(chrome.runtime.getURL('palettes.js'))

  const DEFAULTS = {
    enabled: true,
    follow: true,
    paletteId: 'aurora',
    palette: null,
    accent: '',
    wallpaper: '',
    blur: 6,
    dim: 35,
    panelOpacity: 78,
    reactive: true,
    syncedAt: 0,
  }
  const STYLE_ID = 'mantle-style'
  const WALL_ID = 'mantle-wall'

  let settings = DEFAULTS
  let wallUrl = ''
  let wallSource = ''

  async function load() {
    const { mantle } = await chrome.storage.local.get('mantle')
    return { ...DEFAULTS, ...mantle }
  }

  // A data: wallpaper becomes a blob: URL so the stylesheet stays small.
  async function wallpaperUrl(source) {
    if (source === wallSource) return wallUrl
    if (wallUrl.startsWith('blob:')) URL.revokeObjectURL(wallUrl)
    wallSource = source
    wallUrl = source.startsWith('data:') ? URL.createObjectURL(await (await fetch(source)).blob()) : source
    return wallUrl
  }

  function buildCss(s, wall) {
    const p = s.palette ?? paletteById(s.paletteId)
    const vars = webVars(p, { accent: s.accent })
    const accent2 = p.accent2
    if (wall) {
      // The page's own shades go clear; the panels on top turn translucent.
      const clear = ['--cds-page-bg', '--cds-surface-0', '--cds-surface-1',
        ...[0, 10, 20, 30, 40, 50].map(step => `--cds-neutral-${step}`)]
      const glass = ['--cds-surface-2', '--cds-surface-3', '--cds-surface-panel',
        ...[60, 70, 80, 90, 100].map(step => `--cds-neutral-${step}`)]
      for (const key of clear) vars[key] = 'transparent'
      for (const key of glass) vars[key] = `color-mix(in srgb, ${vars[key]} ${s.panelOpacity}%, transparent)`
    }
    const body = Object.entries(vars).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n')
    const live = s.reactive
      ? `
html.mantle-live {
  --cds-fill-accent: ${accent2} !important;
  --cds-text-accent: ${accent2} !important;
}
html.mantle-live::after {
  content: '';
  position: fixed;
  inset: 0 0 auto 0;
  height: 3px;
  z-index: 2147483647;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, ${vars['--cds-fill-accent']}, ${accent2}, transparent);
  background-size: 50% 100%;
  background-repeat: no-repeat;
  animation: mantle-sweep 1.6s ease-in-out infinite;
}
@keyframes mantle-sweep {
  from { background-position: -50% 0; }
  to { background-position: 150% 0; }
}`
      : ''
    const wallCss = wall
      ? `
html { background: ${p.bg} !important; }
body { background: transparent !important; }
#${WALL_ID} {
  position: fixed;
  inset: -${s.blur * 2 + 2}px;
  z-index: -1;
  pointer-events: none;
  background: url("${wall}") center / cover no-repeat;
  filter: blur(${s.blur}px) brightness(${(100 - s.dim) / 100});
}`
      : ''
    // claude.ai redefines its tokens on every .cds-root scope, not only :root.
    return `:root, .cds-root, .cds-dark-scope {\n${body}\n  color-scheme: ${p.mode};\n}${wallCss}${live}`
  }

  function upsert(id, tag, parent) {
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement(tag)
      el.id = id
      parent.prepend(el)
    }
    return el
  }

  async function apply() {
    const root = document.documentElement
    if (!settings.enabled) {
      document.getElementById(STYLE_ID)?.remove()
      document.getElementById(WALL_ID)?.remove()
      root.classList.remove('mantle-live')
      return
    }
    const wall = settings.wallpaper ? await wallpaperUrl(settings.wallpaper) : ''
    upsert(STYLE_ID, 'style', document.head ?? root).textContent = buildCss(settings, wall)
    if (wall && document.body) upsert(WALL_ID, 'div', document.body)
    else if (!wall) document.getElementById(WALL_ID)?.remove()
  }

  // ---- sync from the Mantle studio --------------------------------------------

  async function syncFromStudio() {
    if (!settings.follow || document.hidden) return
    let payload
    try {
      const res = await fetch(chrome.runtime.getURL('mantle-theme.json') + '?t=' + Date.now(), { cache: 'no-store' })
      if (!res.ok) return
      payload = await res.json()
    } catch {
      return
    }
    if (!payload?.updatedAt || payload.updatedAt <= settings.syncedAt) return
    const next = {
      ...settings,
      paletteId: payload.palette?.id ?? settings.paletteId,
      palette: payload.palette ?? null,
      accent: payload.accent ?? '',
      wallpaper: payload.wallpaper ?? '',
      blur: payload.blur ?? settings.blur,
      dim: payload.dim ?? settings.dim,
      panelOpacity: payload.panelOpacity ?? settings.panelOpacity,
      reactive: payload.reactive ?? settings.reactive,
      syncedAt: payload.updatedAt,
    }
    await chrome.storage.local.set({ mantle: next })
  }

  // ---- live glow while Claude responds ----------------------------------------

  const isResponding = () =>
    !!document.querySelector('[data-is-streaming="true"], button[aria-label="Stop response"], button[aria-label="Stop Response"]')

  setInterval(() => {
    if (!settings.enabled || !settings.reactive) return
    document.documentElement.classList.toggle('mantle-live', isResponding())
  }, 400)

  // ---- wiring -------------------------------------------------------------------

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.mantle) return
    settings = { ...DEFAULTS, ...changes.mantle.newValue }
    void apply()
  })

  settings = await load()
  await apply()
  if (!document.body) document.addEventListener('DOMContentLoaded', () => void apply(), { once: true })
  // React may replace <head>/<body> children on navigation: re-assert our nodes.
  new MutationObserver(() => {
    if (settings.enabled && (!document.getElementById(STYLE_ID) || (settings.wallpaper && !document.getElementById(WALL_ID)))) {
      void apply()
    }
  }).observe(document.documentElement, { childList: true, subtree: false })

  await syncFromStudio()
  setInterval(() => void syncFromStudio(), 3000)
})()
