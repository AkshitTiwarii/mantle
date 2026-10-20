import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Plus, Search } from 'lucide-react'
import { IconBrandGithub as Github } from '@tabler/icons-react'
import { CATALOG, TYPE_LABEL, TYPE_PLURAL } from '../lib/catalog'
import type { Item, ItemType } from '../lib/catalog'
import { LIVE_STATES, PALETTES, stateColor } from '../lib/palettes.js'
import type { LiveState } from '../lib/palettes.js'
import { href } from '../lib/router'
import { INSTALL_COMMAND, REPO_URL } from '../App'
import { ItemCard, ThemeCard, WallpaperCard, stageBackground } from '../components/Card'
import { WALLPAPERS } from '../lib/wallpapers'
import type { WallpaperCategory } from '../lib/wallpapers'
import { useWall } from '../lib/wallpaper'
import { WallpaperPicker } from '../components/WallpaperPicker'
import { ChatPreview, TerminalPreview, TerminalSwatch } from '../components/Previews'
import { Segmented, TypeIcon, copy } from '../components/ui'
import { BentoGrid } from '../components/ui/bento-grid'
import { InfiniteMovingCards } from '../components/ui/infinite-moving-cards'
import { Button as MovingBorderButton } from '../components/ui/moving-border'
import { Terminal } from '../components/ui/terminal'

type Filter = 'all' | ItemType | 'wallpaper'
const TYPES: ItemType[] = ['theme', 'skill', 'connector', 'plugin']
const REAL = CATALOG.filter(i => i.type !== 'theme')

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
      <Marquee />
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
        <a className="btn btn-primary btn-lg" href="#browse" onClick={e => { e.preventDefault(); document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }) }}>
          Browse the gallery <ArrowRight size={16} />
        </a>
        <a className="btn btn-secondary btn-lg" href={href({ page: 'make' })}>
          Make a theme
        </a>
      </div>
      <button className="install-line" onClick={() => copy(INSTALL_COMMAND, 'Install command copied')} title="Copy the install command">
        <span className="prompt">&gt;</span>
        <code>{INSTALL_COMMAND}</code>
        <span className="btn btn-ghost btn-sm">Copy</span>
      </button>

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

function Marquee() {
  const half = Math.ceil(REAL.length / 2)
  const card = (i: Item) => (
    <a className="mq-card" href={href({ page: 'item', id: i.id })}>
      <span className="mq-top">
        <span className={`item-icon icon-${i.type}`}>
          <TypeIcon type={i.type} size={18} />
        </span>
        <span className="flex min-w-0 flex-col">
          <b className="truncate">{i.name}</b>
          <span>
            {TYPE_LABEL[i.type]} · {i.author}
          </span>
        </span>
      </span>
      <p>{i.tagline}</p>
    </a>
  )
  return (
    <section className="band">
      <div className="band-center mb-10">
        <h2>
          Real tools, from <em>the people who make them.</em>
        </h2>
        <p>
          {REAL.length} skills, plugins and connectors, each checked against its own repository, with the exact command its authors document.
        </p>
      </div>
      <InfiniteMovingCards items={REAL.slice(0, half)} render={card} keyOf={i => i.id} speed="slow" />
      <InfiniteMovingCards items={REAL.slice(half)} render={card} keyOf={i => i.id} speed="slow" direction="right" />
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
      <div className="band-head">
        <h2>
          One theme, <em>everywhere you use Claude.</em>
        </h2>
        <p>
          Mantle is a Claude Code plugin with a browser extension. Pick a theme once and it lands on every surface, then keeps reacting while Claude works.
        </p>
      </div>
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
      <div className="band-head">
        <h2>
          The <em>gallery.</em>
        </h2>
        <p>Themes preview live on hover. Everything else links to its source and copies its install command in one click.</p>
      </div>
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
        <span className="result-count" aria-live="polite">
          {items.length + walls.length} {items.length + walls.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {items.length + walls.length === 0 && (
        <div className="empty">
          <p>Nothing matches “{query}”.</p>
          <button className="btn btn-ghost" onClick={() => { setQuery(''); setFilter('all'); setMode('any') }}>
            Clear filters
          </button>
        </div>
      )}

      {themes.length > 0 && (
        <>
          {filter === 'all' && <SectionHead title="Themes" note="Each one covers Claude Code, Windows Terminal and claude.ai, and reacts to what Claude is doing." />}
          <div className="grid grid-themes">
            {themes.map(i => (
              <ThemeCard key={i.id} item={i} />
            ))}
            {!q && (
              <a className="card card-make" href={href({ page: 'make' })}>
                <span className="make-plus">
                  <Plus size={26} strokeWidth={1.6} />
                </span>
                <h3>Make your own theme</h3>
                <p>Pick a few colors, preview every surface live, export three JSON files.</p>
              </a>
            )}
          </div>
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
              ...(['flowers', 'nature', 'space', 'ocean', 'city', 'abstract'] as WallpaperCategory[]).map(c => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })),
            ]}
          />
          <div className="grid grid-themes mt-5">
            {walls.map(w => (
              <WallpaperCard key={w.id} wallpaper={w} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <>
          {filter === 'all' && <SectionHead title="Skills, connectors & plugins" note="Real public projects. Each links to its source and was checked against it." />}
          <div className="grid grid-items">
            {others.map(i => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
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
