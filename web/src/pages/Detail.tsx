import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CATALOG, TYPE_PLURAL, itemById } from '../lib/catalog'
import type { Item } from '../lib/catalog'
import { LIVE_STATES } from '../lib/palettes.js'
import type { LiveState, Palette } from '../lib/palettes.js'
import { href } from '../lib/router'
import { ApplyThemeButton } from '../components/ApplyTheme'
import { ItemCard, ThemeCard } from '../components/Card'
import { ExportPanel } from '../components/ExportPanel'
import { Brand } from '../components/Brand'
import { ChatPreview, TerminalPreview, TerminalSwatch } from '../components/Previews'
import { CopyField, Segmented, StatusBadge, TypePill, copy } from '../components/ui'

export function Detail({ id }: { id: string }) {
  const item = itemById(id)
  if (!item) {
    return (
      <div className="page narrow">
        <a className="back" href="#/"><ArrowLeft size={15} /> Gallery</a>
        <h1>Not found</h1>
        <p>There's no listing called “{id}”.</p>
      </div>
    )
  }
  const related = CATALOG.filter(i => i.type === item.type && i.id !== item.id).slice(0, 3)
  return (
    <div className="page">
      <a className="back" href="#/">
        <ArrowLeft size={15} /> All {TYPE_PLURAL[item.type].toLowerCase()}
      </a>
      <header className="detail-head">
        <div>
          <div className="detail-meta">
            <TypePill type={item.type} />
            <StatusBadge status={item.status} />
            {item.license && <span className="tag">{item.license}</span>}
          </div>
          <h1 className="detail-title">
            {!item.palette && <Brand item={item} size={30} />}
            {item.name}
          </h1>
          <p className="lede">{item.tagline}</p>
          <p className="byline">
            by <b>{item.author}</b>
            {item.source && (
              <>
                {' · '}
                <a href={item.source.url} target="_blank" rel="noreferrer noopener">
                  {item.source.label} <ArrowUpRight size={13} className="inline -translate-y-px" />
                </a>
              </>
            )}
          </p>
        </div>
      </header>

      {item.palette ? <ThemeBody item={item} palette={item.palette} /> : <ItemBody item={item} />}

      {related.length > 0 && (
        <section className="related">
          <h2>More {TYPE_PLURAL[item.type].toLowerCase()}</h2>
          <div className={`grid ${item.type === 'theme' ? 'grid-themes' : 'grid-items'}`}>
            {related.map(r => (r.type === 'theme' ? <ThemeCard key={r.id} item={r} /> : <ItemCard key={r.id} item={r} />))}
          </div>
        </section>
      )}
    </div>
  )
}

function InstallBox({ item }: { item: Item }) {
  return (
    <div className="panel install-box">
      <h2>Install</h2>
      {item.status === 'placeholder' && <p className="note warn">Placeholder listing: these commands show the format and won't install anything.</p>}
      {item.install.map((s, i) => (
        <CopyField key={i} step={s} index={item.install.length > 1 ? i : undefined} />
      ))}
      {item.type === 'theme' && (
        <p className="note">
          <code>/mantle {item.palette?.id}</code> needs the Mantle mod. Without it, use the exports below; each one works on its own.
        </p>
      )}
    </div>
  )
}

function ItemBody({ item }: { item: Item }) {
  return (
    <div className="detail-grid">
      <div className="panel">
        <h2>About</h2>
        <p>{item.description}</p>
        {item.includes && (
          <>
            <h3>Includes</h3>
            <div className="tags">
              {item.includes.map(x => (
                <span key={x} className="tag">
                  {x}
                </span>
              ))}
            </div>
          </>
        )}
        <h3>Tags</h3>
        <div className="tags">
          {item.tags.map(t => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      </div>
      <InstallBox item={item} />
    </div>
  )
}

const SURFACES = ['all', 'code', 'web', 'terminal'] as const
type Surface = (typeof SURFACES)[number]

function ThemeBody({ item, palette: p }: { item: Item; palette: Palette }) {
  const [state, setState] = useState<LiveState>('idle')
  const [auto, setAuto] = useState(false)
  const [surface, setSurface] = useState<Surface>('all')
  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setState(s => LIVE_STATES[(LIVE_STATES.indexOf(s) + 1) % LIVE_STATES.length]), 1300)
    return () => clearInterval(t)
  }, [auto])

  return (
    <>
      <section className="showcase" style={{ background: `radial-gradient(90% 120% at 10% 0%, ${p.surfaceAlt}, ${p.bg} 60%)` }}>
        <div className="showcase-bar">
          <Segmented
            label="Surface"
            value={surface}
            onChange={setSurface}
            options={[
              { value: 'all', label: 'All surfaces' },
              { value: 'code', label: 'Claude Code' },
              { value: 'web', label: 'claude.ai' },
              { value: 'terminal', label: 'Windows Terminal' },
            ]}
          />
          <div className="state-row">
            <Segmented label="Live state" value={state} onChange={s => { setAuto(false); setState(s) }} options={LIVE_STATES.map(s => ({ value: s, label: s }))} />
            <button className={`btn btn-sm ${auto ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAuto(a => !a)}>
              {auto ? 'Pause' : 'Play'}
            </button>
          </div>
        </div>
        <div className={`showcase-stage surface-${surface}`}>
          {(surface === 'all' || surface === 'code') && <TerminalPreview palette={p} state={state} className="show-term" />}
          {(surface === 'all' || surface === 'web') && <ChatPreview palette={p} state={state} className="show-chat" />}
          {(surface === 'all' || surface === 'terminal') && <TerminalSwatch palette={p} className="show-wt" />}
        </div>
      </section>

      <div className="detail-grid">
        <div className="panel">
          <h2>Palette</h2>
          <p className="muted">{item.description}</p>
          <div className="palette-table">
            {(['bg', 'surface', 'surfaceAlt', 'text', 'muted', 'border', 'accent', 'accent2', 'info', 'success', 'warning', 'error'] as const).map(k => (
              <button key={k} className="chip" onClick={() => copy(p[k], `${p[k]} copied`)} title="Copy hex">
                <span className="chip-swatch" style={{ background: p[k] }} />
                <span className="chip-key">{k}</span>
                <code>{p[k]}</code>
              </button>
            ))}
          </div>
          <h3>Terminal colors</h3>
          <div className="ansi-row">
            {p.ansi.map((c, i) => (
              <button key={i} className="ansi" style={{ background: c }} title={c} onClick={() => copy(c, `${c} copied`)} aria-label={`ANSI ${i} ${c}`} />
            ))}
          </div>
        </div>
        <div className="stack">
          <InstallBox item={item} />
          <div className="panel">
            <h2>On this computer</h2>
            <p className="muted">Writes this theme to Claude Code's Mantle theme file. You confirm before anything is written.</p>
            <div className="row">
              <ApplyThemeButton target={{ paletteId: p.id }} name={p.name} />
              <a className="btn btn-ghost" href={href({ page: 'make', from: p.id })}>
                Remix in theme maker
              </a>
            </div>
          </div>
        </div>
      </div>
      <ExportPanel palette={p} />
    </>
  )
}
