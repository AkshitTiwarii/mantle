import { useEffect, useMemo, useState } from 'react'
import { CATALOG, TYPE_PLURAL } from '../lib/catalog'
import type { ItemType } from '../lib/catalog'
import { LIVE_STATES, PALETTES } from '../lib/palettes.js'
import type { LiveState } from '../lib/palettes.js'
import { href } from '../lib/router'
import { ItemCard, ThemeCard } from '../components/Card'
import { ChatPreview, TerminalPreview, TerminalSwatch } from '../components/Previews'
import { Segmented, TypeIcon } from '../components/ui'

type Filter = 'all' | ItemType
const TYPES: ItemType[] = ['theme', 'skill', 'connector', 'plugin']

function readPrefs(): { filter: Filter; hidePlaceholders: boolean } {
  try {
    const j = JSON.parse(localStorage.getItem('mantle.hub') ?? '{}')
    return { filter: j.filter ?? 'all', hidePlaceholders: Boolean(j.hidePlaceholders) }
  } catch {
    return { filter: 'all', hidePlaceholders: false }
  }
}

export function Hub() {
  const [prefs] = useState(readPrefs)
  const [filter, setFilter] = useState<Filter>(prefs.filter)
  const [query, setQuery] = useState('')
  const [hidePlaceholders, setHidePlaceholders] = useState(prefs.hidePlaceholders)
  const [mode, setMode] = useState<'any' | 'dark' | 'light'>('any')

  useEffect(() => {
    try {
      localStorage.setItem('mantle.hub', JSON.stringify({ filter, hidePlaceholders }))
    } catch {}
  }, [filter, hidePlaceholders])

  const q = query.trim().toLowerCase()
  const items = useMemo(
    () =>
      CATALOG.filter(i => filter === 'all' || i.type === filter)
        .filter(i => !hidePlaceholders || i.status !== 'placeholder')
        .filter(i => mode === 'any' || i.type !== 'theme' || i.palette?.mode === mode)
        .filter(i => !q || [i.name, i.tagline, i.description, i.author, ...i.tags, ...(i.includes ?? [])].join(' ').toLowerCase().includes(q)),
    [filter, hidePlaceholders, mode, q],
  )
  const themes = items.filter(i => i.type === 'theme')
  const others = items.filter(i => i.type !== 'theme')
  const count = (t: ItemType) => CATALOG.filter(i => i.type === t).length

  return (
    <>
      <Hero />
      <section className="browse" id="browse">
        <div className="toolbar">
          <Segmented
            label="Filter by type"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: <>All <span className="count">{CATALOG.length}</span></> },
              ...TYPES.map(t => ({
                value: t as Filter,
                label: (
                  <>
                    <TypeIcon type={t} size={14} /> {TYPE_PLURAL[t]} <span className="count">{count(t)}</span>
                  </>
                ),
              })),
            ]}
          />
          <div className="toolbar-right">
            <label className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input type="search" placeholder="Search themes, skills, connectors…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search" />
            </label>
          </div>
        </div>
        <div className="subfilters">
          {(filter === 'all' || filter === 'theme') && (
            <Segmented
              label="Theme mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'any', label: 'Any mode' },
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
            />
          )}
          <label className="check">
            <input type="checkbox" checked={hidePlaceholders} onChange={e => setHidePlaceholders(e.target.checked)} /> Hide placeholders
          </label>
          <span className="result-count">
            {items.length} {items.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {items.length === 0 && (
          <div className="empty">
            <p>Nothing matches “{query}”.</p>
            <button className="btn btn-ghost" onClick={() => { setQuery(''); setFilter('all'); setMode('any') }}>
              Clear filters
            </button>
          </div>
        )}

        {themes.length > 0 && (
          <>
            {filter === 'all' && <SectionHead type="theme" note="Each theme covers Claude Code, Windows Terminal and claude.ai, and reacts to what Claude is doing." />}
            <div className="grid grid-themes">
              {themes.map(i => (
                <ThemeCard key={i.id} item={i} />
              ))}
              {filter !== 'skill' && !q && (
                <a className="card card-make" href={href({ page: 'make' })}>
                  <span className="make-plus">+</span>
                  <h3>Make your own theme</h3>
                  <p>Pick a few colors, preview every surface live, export three JSON files.</p>
                </a>
              )}
            </div>
          </>
        )}

        {others.length > 0 && (
          <>
            {filter === 'all' && <SectionHead note="Skills, connectors (MCP servers) and plugins. Public entries link to their source; placeholders are labelled." />}
            <div className="grid grid-items">
              {others.map(i => (
                <ItemCard key={i.id} item={i} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}

function SectionHead({ type, note }: { type?: ItemType; note: string }) {
  return (
    <div className="section-head">
      <h2>{type ? TYPE_PLURAL[type] : 'Skills, connectors & plugins'}</h2>
      <p>{note}</p>
    </div>
  )
}

// The hero shows the product rather than describing it: one palette on all
// three surfaces, stepping through the live states.
function Hero() {
  const [pi, setPi] = useState(1)
  const [si, setSi] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setSi(n => (n + 1) % LIVE_STATES.length), 1400)
    return () => clearInterval(t)
  }, [paused])
  const p = PALETTES[pi]
  const state: LiveState = LIVE_STATES[si]
  return (
    <section className="hero" style={{ ['--hero-a' as string]: p.accent, ['--hero-b' as string]: p.accent2 }}>
      <div className="hero-copy">
        <span className="eyebrow">For Claude Code, Windows Terminal and claude.ai</span>
        <h1>
          Everything that customizes Claude, <span className="grad">in one place.</span>
        </h1>
        <p className="lede">
          Browse themes, skills, connectors and plugins. Preview every theme on every surface before you install it, then copy one command.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href="#browse" onClick={e => { e.preventDefault(); document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }) }}>
            Browse the gallery
          </a>
          <a className="btn btn-secondary btn-lg" href={href({ page: 'make' })}>
            Make a theme
          </a>
          <a className="btn btn-ghost btn-lg" href={href({ page: 'me' })}>
            See my setup
          </a>
        </div>
        <div className="hero-palettes" role="radiogroup" aria-label="Preview palette">
          {PALETTES.map((x, i) => (
            <button
              key={x.id}
              role="radio"
              aria-checked={i === pi}
              title={x.name}
              className={i === pi ? 'on' : ''}
              onClick={() => setPi(i)}
              style={{ background: `linear-gradient(135deg, ${x.bg} 0 45%, ${x.accent} 45% 70%, ${x.accent2} 70%)` }}
            />
          ))}
          <span className="hero-palette-name">{p.name}</span>
        </div>
      </div>
      <div className="hero-stage" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="stage-glow" style={{ background: `radial-gradient(60% 60% at 50% 40%, ${p.accent}33, transparent 70%)` }} />
        <TerminalPreview palette={p} state={state} className="hero-term" />
        <ChatPreview palette={p} state={state} className="hero-chat" />
        <TerminalSwatch palette={p} className="hero-wt" />
        <div className="state-pills" aria-label="Live state">
          {LIVE_STATES.map((s, i) => (
            <button key={s} className={i === si ? 'on' : ''} onClick={() => { setSi(i); setPaused(true) }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
