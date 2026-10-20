import { useEffect, useMemo, useState } from 'react'
import { LIVE_STATES, PALETTES, isHex, paletteById } from '../lib/palettes.js'
import type { LiveState } from '../lib/palettes.js'
import { baseFrom, contrast, paletteFrom, validBase } from '../lib/exports'
import type { BaseColors } from '../lib/exports'
import { ApplyThemeButton } from '../components/ApplyTheme'
import { ExportPanel } from '../components/ExportPanel'
import { ChatPreview, PaletteStrip, TerminalPreview, TerminalSwatch } from '../components/Previews'
import { Segmented } from '../components/ui'

const DRAFT_KEY = 'mantle.maker.draft'

const FIELDS: { key: keyof Omit<BaseColors, 'name' | 'mode'>; label: string; hint: string }[] = [
  { key: 'bg', label: 'Background', hint: 'Terminal and page background' },
  { key: 'text', label: 'Text', hint: 'Body text everywhere' },
  { key: 'accent', label: 'Accent', hint: 'Idle accent, links, send button' },
  { key: 'accent2', label: 'Thinking', hint: 'Second accent; lights up while Claude thinks' },
  { key: 'info', label: 'Working', hint: 'While tools run; also blue in the terminal' },
  { key: 'warning', label: 'Plan', hint: 'Plan mode; also yellow' },
  { key: 'success', label: 'Done', hint: 'Finished turns, added lines; also green' },
  { key: 'error', label: 'Error', hint: 'Failures, removed lines; also red' },
]

function loadDraft(from?: string): BaseColors {
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

export function Maker({ from }: { from?: string }) {
  const [base, setBase] = useState<BaseColors>(() => loadDraft(from))
  const [state, setState] = useState<LiveState>('idle')
  const [drafts, setDrafts] = useState<Partial<Record<keyof BaseColors, string>>>({})

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(base))
    } catch {}
  }, [base])

  const palette = useMemo(() => paletteFrom(base), [base])
  const set = (patch: Partial<BaseColors>) => setBase(b => ({ ...b, ...patch }))

  const textContrast = contrast(base.text, base.bg)
  const accentContrast = contrast(base.accent, base.bg)
  const warnings = [
    textContrast < 4.5 && `Text on background is ${textContrast.toFixed(1)}:1; aim for at least 4.5:1.`,
    accentContrast < 3 && `Accent on background is ${accentContrast.toFixed(1)}:1; aim for at least 3:1.`,
  ].filter(Boolean) as string[]

  return (
    <div className="page maker">
      <header className="page-head">
        <span className="eyebrow">Theme maker</span>
        <h1>Make a theme</h1>
        <p className="lede">Pick eight colors. Mantle derives the surfaces, borders and all 16 terminal colors, and previews every surface as you go.</p>
      </header>

      <div className="maker-grid">
        <div className="panel maker-controls">
          <div className="field">
            <label htmlFor="start">Start from</label>
            <select
              id="start"
              value=""
              onChange={e => {
                if (e.target.value) {
                  setBase(b => ({ ...baseFrom(paletteById(e.target.value)), name: b.name }))
                  setDrafts({})
                }
              }}
            >
              <option value="">Choose a preset…</option>
              {PALETTES.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-row">
            <div className="field grow">
              <label htmlFor="name">Name</label>
              <input id="name" value={base.name} maxLength={40} onChange={e => set({ name: e.target.value })} />
            </div>
            <div className="field">
              <label>Mode</label>
              <Segmented
                label="Mode"
                value={base.mode}
                onChange={m =>
                  setBase(b => {
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
            {FIELDS.map(f => (
              <div key={f.key} className="color-field">
                <input
                  type="color"
                  aria-label={`${f.label} color`}
                  value={base[f.key].length === 4 ? `#${[...base[f.key].slice(1)].map(c => c + c).join('')}` : base[f.key]}
                  onChange={e => {
                    set({ [f.key]: e.target.value } as Partial<BaseColors>)
                    setDrafts(d => ({ ...d, [f.key]: undefined }))
                  }}
                />
                <div className="color-text">
                  <label htmlFor={`hex-${f.key}`}>{f.label}</label>
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
                    if (isHex(hex)) set({ [f.key]: hex.toLowerCase() } as Partial<BaseColors>)
                  }}
                  onBlur={() => setDrafts(d => ({ ...d, [f.key]: undefined }))}
                />
              </div>
            ))}
          </div>

          {warnings.length > 0 && (
            <ul className="warnings">
              {warnings.map(w => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <div className="row">
            <button className="btn btn-secondary" onClick={() => { set(surprise(base.mode)); setDrafts({}) }}>
              Surprise me
            </button>
            <button className="btn btn-ghost" onClick={() => { setBase({ ...baseFrom(PALETTES[1]), name: 'My theme' }); setDrafts({}) }}>
              Reset
            </button>
          </div>
        </div>

        <div className="maker-preview">
          <div className="maker-sticky">
            <div className="preview-bar">
              <Segmented label="Live state" value={state} onChange={setState} options={LIVE_STATES.map(s => ({ value: s, label: s }))} />
            </div>
            <div className="maker-stage" style={{ background: `radial-gradient(100% 100% at 0% 0%, ${palette.surfaceAlt}, ${palette.bg} 70%)` }}>
              <TerminalPreview palette={palette} state={state} className="mk-term" />
              <div className="mk-side">
                <ChatPreview palette={palette} state={state} className="mk-chat" />
                <TerminalSwatch palette={palette} className="mk-wt" />
              </div>
            </div>
            <PaletteStrip palette={palette} className="strip-lg" />
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
