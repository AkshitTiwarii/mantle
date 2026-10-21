import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Dices, ImagePlus, Link2, Lock, LockOpen, Undo2, Wand2 } from 'lucide-react'
import { LIVE_STATES, PALETTES, isHex, paletteById } from '../lib/palettes.js'
import type { LiveState } from '../lib/palettes.js'
import { baseFrom, contrast, paletteFrom, validBase } from '../lib/exports'
import type { BaseColors } from '../lib/exports'
import { themeFromImage } from '../lib/extract'
import { href } from '../lib/router'
import { pairedWall, useWall, useWallChoice } from '../lib/wallpaper'
import type { Wall } from '../lib/wallpaper'
import { ApplyThemeButton } from '../components/ApplyTheme'
import { ExportPanel } from '../components/ExportPanel'
import { WallpaperPicker } from '../components/WallpaperPicker'
import { stageBackground } from '../components/Card'
import { ChatPreview, PaletteStrip, TerminalPreview, TerminalSwatch } from '../components/Previews'
import { Segmented, copy, toast } from '../components/ui'

const DRAFT_KEY = 'mantle.maker.draft'

const FIELDS = [
  { key: 'bg', label: 'Background', hint: 'Terminal and page background' },
  { key: 'text', label: 'Text', hint: 'Body text everywhere' },
  { key: 'accent', label: 'Accent', hint: 'Idle accent, links, send button' },
  { key: 'accent2', label: 'Thinking', hint: 'Second accent; lights up while Claude thinks' },
  { key: 'info', label: 'Working', hint: 'While tools run; also blue in the terminal' },
  { key: 'warning', label: 'Plan', hint: 'Plan mode; also yellow' },
  { key: 'success', label: 'Done', hint: 'Finished turns, added lines; also green' },
  { key: 'error', label: 'Error', hint: 'Failures, removed lines; also red' },
] as const satisfies readonly { key: keyof Omit<BaseColors, 'name' | 'mode'>; label: string; hint: string }[]

type ColorKey = (typeof FIELDS)[number]['key']

// Share links carry the whole theme in the URL: mode, eight hex colors, name.
export function encodeShare(b: BaseColors): string {
  return `${b.mode === 'light' ? 'l' : 'd'}${FIELDS.map(f => b[f.key].replace('#', '')).join('')}.${encodeURIComponent(b.name)}`
}

function decodeShare(t: string): BaseColors | null {
  const m = t.match(/^([dl])([0-9a-f]{48})\.(.*)$/i)
  if (!m) return null
  const b = { name: decodeURIComponent(m[3]) || 'Shared theme', mode: m[1] === 'l' ? 'light' : 'dark' } as BaseColors
  FIELDS.forEach((f, i) => (b[f.key] = `#${m[2].slice(i * 6, i * 6 + 6).toLowerCase()}`))
  return validBase(b) ? b : null
}

function loadDraft(from?: string, share?: string): BaseColors {
  const shared = share ? decodeShare(share) : null
  if (shared) return shared
  if (from) return baseFrom(paletteById(from))
  try {
    const j = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
    if (j && validBase(j)) return j
  } catch {}
  return { ...baseFrom(PALETTES[1]), name: 'My theme' }
}

function hsl(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// A random but coherent palette: one hue family for the base, accents spaced
// around the wheel, status colors kept near their usual hues.
function surprise(mode: 'dark' | 'light'): Omit<BaseColors, 'name'> {
  const h = Math.floor(Math.random() * 360)
  const dark = mode === 'dark'
  return {
    mode,
    bg: dark ? hsl(h, 0.32, 0.09) : hsl(h, 0.35, 0.96),
    text: dark ? hsl(h, 0.3, 0.91) : hsl(h, 0.25, 0.14),
    accent: hsl((h + 160) % 360, 0.75, dark ? 0.66 : 0.42),
    accent2: hsl((h + 220) % 360, 0.7, dark ? 0.72 : 0.45),
    info: hsl(210, 0.75, dark ? 0.66 : 0.42),
    warning: hsl(42, 0.85, dark ? 0.62 : 0.38),
    success: hsl(135, 0.45, dark ? 0.62 : 0.32),
    error: hsl(4, 0.75, dark ? 0.64 : 0.45),
  }
}

const sameColors = (a: BaseColors, b: Pick<BaseColors, ColorKey>) => FIELDS.every(f => a[f.key].toLowerCase() === b[f.key].toLowerCase())

export function Maker({ from, share }: { from?: string; share?: string }) {
  const [base, setBaseRaw] = useState<BaseColors>(() => loadDraft(from, share))
  const [state, setState] = useState<LiveState>('idle')
  const [drafts, setDrafts] = useState<Partial<Record<ColorKey, string>>>({})
  const [locked, setLocked] = useState<Set<ColorKey>>(() => new Set())
  const [busy, setBusy] = useState(false)
  const [source, setSource] = useState<Wall | null>(null)
  const history = useRef<BaseColors[]>([])
  const choice = useWallChoice()

  // Whole-theme changes (presets, shuffle, wallpaper, mode) go on the undo stack;
  // per-color edits don't, so dragging a color picker doesn't flood it.
  const commit = useCallback((next: (b: BaseColors) => BaseColors) => {
    setBaseRaw(b => {
      history.current = [...history.current.slice(-30), b]
      return next(b)
    })
    setDrafts({})
  }, [])
  const undo = useCallback(() => {
    const prev = history.current.pop()
    if (prev) {
      setBaseRaw(prev)
      setDrafts({})
    } else toast('Nothing to undo')
  }, [])
  const setColor = (key: ColorKey, hex: string) => setBaseRaw(b => ({ ...b, [key]: hex }))

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(base))
    } catch {}
  }, [base])

  const palette = useMemo(() => paletteFrom(base), [base])
  const wall = useWall(palette.id)

  // Shuffle keeps whatever is locked.
  const shuffle = useCallback(() => {
    commit(b => {
      const fresh = surprise(b.mode)
      const next = { ...b }
      for (const f of FIELDS) if (!locked.has(f.key)) next[f.key] = fresh[f.key]
      return next
    })
  }, [locked, commit])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, select, textarea, button, label, [contenteditable]')) return
      if (e.code === 'Space') {
        e.preventDefault()
        shuffle()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shuffle, undo])

  // The stage shows the visitor's pick; on "Matched" it shows the image the theme
  // was built from, else a preset's pairing, so a new theme is never seen bare.
  const stageWall = choice === 'none' ? null : typeof choice === 'object' ? choice : (wall ?? source ?? pairedWall('aurora'))
  const sourceWall = stageWall ?? pairedWall('aurora')
  const fromImage = async (src: string, label: string, own = false) => {
    setBusy(true)
    try {
      const t = await themeFromImage(src, base.mode, label)
      commit(b => {
        const next = { ...t }
        for (const k of locked) next[k] = b[k]
        return next
      })
      setSource(prev => {
        if (prev?.own && prev.src !== src) URL.revokeObjectURL(prev.src)
        return { id: own ? 'own-source' : `source-${label}`, name: label, src, thumb: src, own }
      })
      toast(`Theme built from ${label}`)
    } catch {
      toast('Could not read that image; try another', 'error')
    } finally {
      setBusy(false)
    }
  }

  const shareLink = () => copy(`${location.origin}${location.pathname}${href({ page: 'make', share: encodeShare(base) })}`, 'Share link copied')

  const textContrast = contrast(base.text, base.bg)
  const accentContrast = contrast(base.accent, base.bg)
  const warnings = [
    textContrast < 4.5 && `Text on background is ${textContrast.toFixed(1)}:1; aim for at least 4.5:1.`,
    accentContrast < 3 && `Accent on background is ${accentContrast.toFixed(1)}:1; aim for at least 3:1.`,
  ].filter(Boolean) as string[]

  return (
    <div className="page maker">
      <header className="page-head">
        <h1>Make a theme</h1>
        <p className="lede">Start from a preset or a wallpaper, then tune eight colors. Mantle derives the surfaces, borders and all 16 terminal colors and previews every surface as you go.</p>
      </header>

      <div className="maker-presets" role="radiogroup" aria-label="Start from a preset">
        {PALETTES.map(p => {
          const on = sameColors(base, p)
          return (
            <motion.button
              key={p.id}
              role="radio"
              aria-checked={on}
              className={`preset-chip ${on ? 'on' : ''}`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => commit(b => ({ ...baseFrom(p), name: b.name === 'My theme' || PALETTES.some(x => x.name === b.name) ? p.name : b.name }))}
            >
              <span className="preset-sw" style={{ background: p.bg }}>
                {[p.accent, p.accent2, p.success, p.error].map((c, i) => (
                  <i key={i} style={{ background: c }} />
                ))}
              </span>
              {p.name}
            </motion.button>
          )
        })}
      </div>

      <div className="maker-grid">
        <div className="panel maker-controls">
          <div className="maker-tools">
            <button className="btn btn-primary" onClick={() => sourceWall && fromImage(sourceWall.src, sourceWall.name)} disabled={busy || !sourceWall} title="Build a theme from the wallpaper on the stage">
              <Wand2 size={16} /> {busy ? 'Reading colors…' : `Theme from “${sourceWall?.name ?? 'wallpaper'}”`}
            </button>
            <label className="btn btn-secondary" title="Build a theme from an image on your computer. It never leaves this tab.">
              <ImagePlus size={16} /> From my image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) {
                    fromImage(URL.createObjectURL(f), f.name.replace(/\.[^.]+$/, ''), true)
                  }
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          <div className="field-row">
            <div className="field grow">
              <label htmlFor="name">Name</label>
              <input id="name" value={base.name} maxLength={40} onChange={e => setBaseRaw(b => ({ ...b, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Mode</label>
              <Segmented
                label="Mode"
                value={base.mode}
                onChange={m =>
                  commit(b => {
                    // Keep the mode honest: a light theme needs a light background.
                    const bgIsLight = contrast(b.bg, '#000000') > contrast(b.bg, '#ffffff')
                    const swap = (m === 'light') !== bgIsLight
                    return { ...b, mode: m, ...(swap ? { bg: b.text, text: b.bg } : {}) }
                  })
                }
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                ]}
              />
            </div>
          </div>

          <div className="colors">
            {FIELDS.map(f => {
              const isLocked = locked.has(f.key)
              const need = f.key === 'text' ? 4.5 : 3
              const ratio = f.key === 'bg' ? null : contrast(base[f.key], base.bg)
              return (
                <div key={f.key} className={`color-field ${isLocked ? 'locked' : ''}`}>
                  <motion.span className="swatch-pop" key={base[f.key]} initial={{ scale: 0.82 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 20 }}>
                    <input
                      type="color"
                      aria-label={`${f.label} color`}
                      value={base[f.key].length === 4 ? `#${[...base[f.key].slice(1)].map(c => c + c).join('')}` : base[f.key]}
                      onChange={e => {
                        setColor(f.key, e.target.value)
                        setDrafts(d => ({ ...d, [f.key]: undefined }))
                      }}
                    />
                  </motion.span>
                  <div className="color-text">
                    <label htmlFor={`hex-${f.key}`}>
                      {f.label}
                      {ratio !== null && (
                        <span className={`ratio ${ratio >= need ? 'ok' : 'low'}`} title={`Contrast on the background; aim for ${need}:1`}>
                          {ratio.toFixed(1)}:1
                        </span>
                      )}
                    </label>
                    <span className="hint">{f.hint}</span>
                  </div>
                  <input
                    id={`hex-${f.key}`}
                    className={`hex ${drafts[f.key] !== undefined && !isHex(drafts[f.key]) ? 'invalid' : ''}`}
                    value={drafts[f.key] ?? base[f.key]}
                    spellCheck={false}
                    onChange={e => {
                      const v = e.target.value.trim()
                      setDrafts(d => ({ ...d, [f.key]: v }))
                      const hex = v.startsWith('#') ? v : `#${v}`
                      if (isHex(hex)) setColor(f.key, hex.toLowerCase())
                    }}
                    onBlur={() => setDrafts(d => ({ ...d, [f.key]: undefined }))}
                  />
                  <button
                    className="lock"
                    aria-pressed={isLocked}
                    aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${f.label}`}
                    title={isLocked ? 'Locked: shuffle and wallpaper themes keep this color' : 'Lock this color'}
                    onClick={() =>
                      setLocked(l => {
                        const n = new Set(l)
                        if (!n.delete(f.key)) n.add(f.key)
                        return n
                      })
                    }
                  >
                    {isLocked ? <Lock size={14} /> : <LockOpen size={14} />}
                  </button>
                </div>
              )
            })}
          </div>

          {warnings.length > 0 && (
            <ul className="warnings">
              {warnings.map(w => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <div className="row maker-actions">
            <button className="btn btn-secondary" onClick={shuffle} title="Shuffle the unlocked colors">
              <Dices size={16} /> Shuffle <kbd>Space</kbd>
            </button>
            <button className="btn btn-ghost" onClick={undo} title="Undo (Ctrl+Z)">
              <Undo2 size={16} /> Undo
            </button>
            <button className="btn btn-ghost" onClick={shareLink} title="Copy a link that opens this theme in the maker">
              <Link2 size={16} /> Share link
            </button>
          </div>
        </div>

        <div className="maker-preview">
          <div className="maker-sticky">
            <div className="preview-bar">
              <Segmented label="Live state" value={state} onChange={setState} options={LIVE_STATES.map(s => ({ value: s, label: s }))} />
            </div>
            <div className="maker-stage" style={{ background: stageBackground(palette.surfaceAlt, palette.bg, stageWall?.src) }}>
              <TerminalPreview palette={palette} state={state} className="mk-term" wallpaper={stageWall?.src} />
              <div className="mk-side">
                <ChatPreview palette={palette} state={state} className="mk-chat" wallpaper={stageWall?.src} />
                <TerminalSwatch palette={palette} className="mk-wt" wallpaper={stageWall?.src} />
              </div>
            </div>
            <PaletteStrip palette={palette} className="strip-lg" />
            <WallpaperPicker more={false} />
            <div className="row">
              <ApplyThemeButton target={{ palette }} name={palette.name} />
            </div>
          </div>
        </div>
      </div>

      <ExportPanel palette={palette} title="Export your theme" />
    </div>
  )
}
