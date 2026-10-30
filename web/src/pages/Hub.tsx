import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Plus, Search, ShieldCheck } from 'lucide-react'
import { IconBrandGithub as Github } from '@tabler/icons-react'
import { CATALOG, TYPE_PLURAL } from '../lib/catalog'
import type { ItemType } from '../lib/catalog'
import { LIVE_STATES, PALETTES, stateColor } from '../lib/palettes.js'
import type { LiveState } from '../lib/palettes.js'
import { href } from '../lib/router'
import { INSTALL_COMMAND, REPO_URL } from '../App'
import { ItemCard, ThemeCard, WallpaperCard, stageBackground } from '../components/Card'
import { WALLPAPERS } from '../lib/wallpapers'
import type { WallpaperCategory } from '../lib/wallpapers'
import { useWall } from '../lib/wallpaper'
import { WallpaperPicker } from '../components/WallpaperPicker'
import { AgentConnect } from '../components/AgentConnect'
import { WhatsNew } from '../components/WhatsNew'
import { ChatPreview, TerminalPreview, TerminalSwatch } from '../components/Previews'
import { Segmented, TypeIcon, copy } from '../components/ui'
import { BentoGrid } from '../components/ui/bento-grid'
import { Button as MovingBorderButton } from '../components/ui/moving-border'
import { Terminal } from '../components/ui/terminal'
import { AnimatedGrid, Reveal } from '../components/Motion'

type Filter = 'all' | ItemType | 'wallpaper'
const TYPES: ItemType[] = ['theme', 'skill', 'connector', 'plugin']

function readFilter(): Filter {
  try {
    return JSON.parse(localStorage.getItem('mantle.hub') ?? '{}').filter ?? 'all'
  } catch {
    return 'all'
  }
}

export function Hub() {
  return (
    <>
      <Hero />
      <div className="rule" />
      <WhatsNew />
      <div className="rule" />
      <HowItWorks />
      <div className="rule" />
      <Browse />
      <div className="rule" />
      <Closer />
    </>
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
    const t = setInterval(() => setSi(n => (n + 1) % LIVE_STATES.length), 1500)
    return () => clearInterval(t)
  }, [paused])
  const p = PALETTES[pi]
  const state: LiveState = LIVE_STATES[si]
  const wall = useWall(p.id)
  return (
    <section className="hero">
      <h1>
        Everything that customizes Claude, <em>in one place.</em>
      </h1>
      <p className="lede">
        Themes, skills, connectors and plugins, gathered from the people who make them. Preview every theme on Claude Code, your terminal and claude.ai, then install with one paste.
      </p>
      <div className="hero-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' })}>
          Browse the gallery <ArrowRight size={16} />
        </button>
        <a className="btn btn-secondary btn-lg" href={href({ page: 'make' })}>
          Make a theme
        </a>
      </div>
      <button className="install-line" onClick={() => copy(INSTALL_COMMAND, 'Install command copied')} title="Copy the install command">
        <span className="prompt">&gt;</span>
        <code>{INSTALL_COMMAND}</code>
        <span className="btn btn-ghost btn-sm">Copy</span>
      </button>
      <button type="button" className="hero-new" onClick={() => document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' })}>
        <ShieldCheck size={15} aria-hidden /> New in 0.3: vet skills before you install, and a setup doctor <ArrowRight size={14} aria-hidden />
      </button>

      <AgentConnect />

      <figure className="hero-plate" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="hero-stage" style={{ background: stageBackground(p.surfaceAlt, p.bg, wall?.src) }}>
          <TerminalPreview palette={p} state={state} className="hero-term" wallpaper={wall?.src} />
          <ChatPreview palette={p} state={state} className="hero-chat" wallpaper={wall?.src} />
          <TerminalSwatch palette={p} className="hero-wt" wallpaper={wall?.src} />
        </div>
        <figcaption className="plate-caption">
          <div className="hero-palettes" role="radiogroup" aria-label="Preview theme">
            {PALETTES.map((x, i) => (
              <button
                key={x.id}
                role="radio"
                aria-checked={i === pi}
                aria-label={x.name}
                title={x.name}
                className={i === pi ? 'on' : ''}
                onClick={() => setPi(i)}
                style={{ background: `linear-gradient(135deg, ${x.bg} 0 45%, ${x.accent} 45% 72%, ${x.accent2} 72%)` }}
              />
            ))}
            <span className="plate-name">
              {p.name} <em>· {state}</em>
            </span>
          </div>
          <div className="state-pills" role="group" aria-label="Live state">
            {LIVE_STATES.map((s, i) => (
              <button key={s} className={i === si ? 'on' : ''} onClick={() => { setSi(i); setPaused(true) }}>
                <span className="swatch" style={{ background: stateColor(p, s) }} />
                {s}
              </button>
            ))}
          </div>
        </figcaption>
        <WallpaperPicker />
      </figure>
    </section>
  )
}

function HowItWorks() {
  const p = PALETTES[0]
  const [lit, setLit] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setLit(n => (n + 1) % LIVE_STATES.length), 1200)
    return () => clearInterval(t)
  }, [])
  return (
    <section className="band">
      <Reveal className="band-head">
        <h2>
          One theme, <em>everywhere you use Claude.</em>
        </h2>
        <p>
          Mantle is a Claude Code plugin with a browser extension. Pick a theme once and it lands on every surface, then keeps reacting while Claude works.
        </p>
      </Reveal>
      <BentoGrid className="max-w-none gap-4 md:auto-rows-[21rem]">
        <div className="bento-cell md:col-span-2">
          <div className="bento-art term-art">
            <Terminal
              className="h-full [&>div]:h-full"
              username="~/acme-app"
              enableSound={false}
              typingSpeed={38}
              commands={[INSTALL_COMMAND, '/mantle aurora']}
              outputs={{
                0: ['✔ Installed mantle. Plugin is now active.'],
                1: ['Mantle: Aurora applied to code, terminal, web.'],
              }}
            />
          </div>
          <div>
            <h3>Install in one paste</h3>
            <p>Every listing carries the command its authors document. For Mantle that is two lines in Claude Code.</p>
          </div>
        </div>
        <div className="bento-cell">
          <div className="bento-art bento-art-paper states-art">
            {LIVE_STATES.map((s, i) => (
              <span key={s} className={`state-chip ${i === lit ? 'on' : ''}`} style={{ background: p.bg, color: stateColor(p, s) }}>
                <i style={{ background: stateColor(p, s) }} />
                {s}
              </span>
            ))}
          </div>
          <div>
            <h3>Alive to what Claude is doing</h3>
            <p>Thinking, running a tool, planning, done, error: the accent follows.</p>
          </div>
        </div>
        <div className="bento-cell">
          <div className="bento-art surfaces-art" style={{ background: `radial-gradient(120% 120% at 0% 0%, ${PALETTES[2].surfaceAlt}, ${PALETTES[2].bg} 65%)` }}>
            <TerminalPreview palette={PALETTES[2]} state="working" />
            <ChatPreview palette={PALETTES[2]} state="working" />
          </div>
          <div>
            <h3>Three surfaces, one palette</h3>
            <p>Claude Code, a Windows Terminal profile with wallpaper and acrylic, and claude.ai.</p>
          </div>
        </div>
        <div className="bento-cell">
          <div className="bento-art bento-art-paper local-art">
            {[
              ['skill', 'grill-me', '~/.claude/skills'],
              ['plugin', 'ponytail', 'enabled'],
              ['connector', 'github', 'http'],
              ['theme', 'Mantle (live)', 'themes/'],
            ].map(([t, name, where]) => (
              <span key={name} className="local-row">
                <span className={`icon-${t}`}>
                  <TypeIcon type={t as ItemType} size={15} />
                </span>
                {name}
                <code>{where}</code>
              </span>
            ))}
          </div>
          <div>
            <h3>My Claude, on your machine</h3>
            <p>A local companion lists what you have installed. Nothing leaves your computer.</p>
          </div>
        </div>
        <a className="bento-cell no-underline" href={href({ page: 'make' })}>
          <div className="bento-art bento-art-paper maker-art">
            {PALETTES.flatMap(x => [x.accent, x.accent2]).slice(0, 14).map((c, i) => (
              <span key={i} style={{ background: c }} />
            ))}
          </div>
          <div>
            <h3>Make your own</h3>
            <p>Pick a few colors, watch every surface update, export three files.</p>
          </div>
        </a>
      </BentoGrid>
    </section>
  )
}

function Browse() {
  const [filter, setFilter] = useState<Filter>(readFilter)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'any' | 'dark' | 'light'>('any')

  useEffect(() => {
    try {
      localStorage.setItem('mantle.hub', JSON.stringify({ filter }))
    } catch {}
  }, [filter])

  const q = query.trim().toLowerCase()
  const items = useMemo(
    () =>
      CATALOG.filter(i => filter === 'all' || i.type === filter)
        .filter(i => mode === 'any' || i.type !== 'theme' || i.palette?.mode === mode)
        .filter(i => !q || [i.name, i.tagline, i.description, i.author, ...i.tags, ...(i.includes ?? [])].join(' ').toLowerCase().includes(q)),
    [filter, mode, q],
  )
  const [category, setCategory] = useState<'any' | WallpaperCategory>('any')
  const walls = useMemo(
    () =>
      filter === 'all' || filter === 'wallpaper'
        ? WALLPAPERS.filter(w => category === 'any' || w.category === category).filter(w => !q || [w.name, w.category, w.author].join(' ').toLowerCase().includes(q))
        : [],
    [filter, category, q],
  )
  const themes = items.filter(i => i.type === 'theme')
  const others = items.filter(i => i.type !== 'theme')
  const count = (t: ItemType) => CATALOG.filter(i => i.type === t).length

  return (
    <section className="browse" id="browse">
      <Reveal className="band-head">
        <h2>
          The <em>gallery.</em>
        </h2>
        <p>Themes preview live on hover. Skills, connectors and plugins carry their makers' logos, link to their source and copy their install command in one click.</p>
      </Reveal>
      <div className="toolbar">
        <Segmented
          label="Filter by type"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: <>All <span className="count">{CATALOG.length + WALLPAPERS.length}</span></> },
            ...TYPES.map(t => ({
              value: t as Filter,
              label: (
                <>
                  <TypeIcon type={t} size={14} /> {TYPE_PLURAL[t]} <span className="count">{count(t)}</span>
                </>
              ),
            })),
            { value: 'wallpaper' as Filter, label: <>Wallpapers <span className="count">{WALLPAPERS.length}</span></> },
          ]}
        />
        <div className="toolbar-right">
          <label className="search">
            <Search size={16} aria-hidden />
            <input type="search" placeholder="Search grill-me, github, synthwave…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search the gallery" />
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
        <a className="atlas-entry" href={href({ page: 'explore', q: query })}>
          Search all 47,000+ skills, connectors and plugins <ArrowRight size={14} aria-hidden />
        </a>
        <span className="result-count" aria-live="polite">
          {items.length + walls.length} {items.length + walls.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {items.length + walls.length === 0 && (
        <div className="empty">
          <p>Nothing matches “{query}”.</p>
          <div className="row justify-center">
            {q && (
              <a className="btn btn-secondary" href={href({ page: 'explore', q: query })}>
                Search the full index <ArrowRight size={16} aria-hidden />
              </a>
            )}
            <button className="btn btn-ghost" onClick={() => { setQuery(''); setFilter('all'); setMode('any') }}>
              Clear filters
            </button>
          </div>
        </div>
      )}

      {themes.length > 0 && (
        <>
          {filter === 'all' && <SectionHead title="Themes" note="Each one covers Claude Code, Windows Terminal and claude.ai, and reacts to what Claude is doing." />}
          <AnimatedGrid
            className="grid grid-themes"
            items={themes}
            keyOf={i => i.id}
            render={i => <ThemeCard item={i} />}
            tail={
              !q && (
                <a className="card card-make" href={href({ page: 'make' })}>
                  <span className="make-plus">
                    <Plus size={26} strokeWidth={1.6} />
                  </span>
                  <h3>Make your own theme</h3>
                  <p>Pick a few colors or drop in a wallpaper, preview every surface live, share a link.</p>
                </a>
              )
            }
          />
        </>
      )}

      {walls.length > 0 && (
        <div id="wallpapers" className="scroll-mt-24">
          <div className="section-head">
            <h2>Wallpapers</h2>
            <p>Freely licensed 4K images, credited to their makers. One command puts one behind your terminal and claude.ai.</p>
          </div>
          <Segmented
            label="Wallpaper category"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'any' as const, label: 'All' },
              ...(['flowers', 'nature', 'mountains', 'space', 'ocean', 'city', 'minimal', 'abstract'] as WallpaperCategory[]).map(c => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })),
            ]}
          />
          <AnimatedGrid className="grid grid-themes mt-5" items={walls} keyOf={w => w.id} render={w => <WallpaperCard wallpaper={w} />} />
        </div>
      )}

      {others.length > 0 && (
        <>
          {filter === 'all' && <SectionHead title="Skills, connectors & plugins" note="Real public projects. Each links to its source and was checked against it." />}
          <AnimatedGrid className="grid grid-items" items={others} keyOf={i => i.id} render={i => <ItemCard item={i} />} />
        </>
      )}
    </section>
  )
}

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <p>{note}</p>
    </div>
  )
}

function Closer() {
  return (
    <section className="closer">
      <h2>
        Make Claude <em>yours.</em>
      </h2>
      <p>Install Mantle, pick a theme, and watch your terminal, Claude Code and claude.ai change together.</p>
      <div className="hero-actions">
        <MovingBorderButton
          as="button"
          onClick={() => copy(INSTALL_COMMAND, 'Install command copied')}
          borderRadius="12px"
          duration={3200}
          containerClassName="h-[52px] w-[220px]"
          borderClassName="bg-[radial-gradient(#10b981_40%,transparent_60%)]"
          className="border-[#1a1a1a] bg-[#0a0a0a] text-[15px] font-semibold text-white"
        >
          Copy install command
        </MovingBorderButton>
        <a className="btn btn-secondary btn-lg" href={REPO_URL} target="_blank" rel="noreferrer">
          <Github size={16} /> Star on GitHub
        </a>
      </div>
    </section>
  )
}
