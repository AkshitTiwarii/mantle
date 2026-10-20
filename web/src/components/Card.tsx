import { useEffect, useState } from 'react'
import { LIVE_STATES } from '../lib/palettes.js'
import type { LiveState } from '../lib/palettes.js'
import type { Item } from '../lib/catalog'
import { href } from '../lib/router'
import { ChatPreview, PaletteStrip, TerminalPreview } from './Previews'
import { Download, ImageIcon } from 'lucide-react'
import { PALETTES, paletteById } from '../lib/palettes.js'
import { setWall, toWall, useWall, useWallChoice, wallCommand } from '../lib/wallpaper'
import type { Wallpaper } from '../lib/wallpapers'
import { InstallButton, StatusBadge, TypeIcon, TypePill, copy } from './ui'

// Cycle the live states while hovered so a card shows its theme reacting.
export function useCycle(active: boolean, ms = 1100): LiveState {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!active) {
      setI(0)
      return
    }
    setI(1)
    const t = setInterval(() => setI(n => (n + 1) % LIVE_STATES.length), ms)
    return () => clearInterval(t)
  }, [active, ms])
  return LIVE_STATES[i]
}

export function ThemeCard({ item }: { item: Item }) {
  const p = item.palette!
  const [hover, setHover] = useState(false)
  const state = useCycle(hover)
  const wall = useWall(p.id)
  return (
    <article
      className="card card-theme"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{ ['--card-accent' as string]: p.accent }}
    >
      <div className="card-stage" style={{ background: stageBackground(p.surfaceAlt, p.bg, wall?.thumb) }}>
        <TerminalPreview palette={p} state={state} className="stage-term" wallpaper={wall?.thumb} />
        <ChatPreview palette={p} state={state} className="stage-chat" wallpaper={wall?.thumb} />
        <span className="stage-state" style={{ color: p.text, background: `${p.bg}cc` }}>
          {hover ? state : 'hover to see it react'}
        </span>
      </div>
      <PaletteStrip palette={p} />
      <div className="card-body">
        <div className="card-head">
          <h3>
            <a className="stretched" href={href({ page: 'item', id: item.id })}>
              {item.name}
            </a>
          </h3>
          <span className="mode-tag">{p.mode}</span>
        </div>
        <p className="tagline">{item.tagline}</p>
        <div className="card-foot">
          <div className="tags">
            {item.tags.filter(t => t !== p.mode).slice(0, 3).map(t => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
          <InstallButton item={item} compact />
        </div>
      </div>
    </article>
  )
}

export function ItemCard({ item }: { item: Item }) {
  return (
    <article className={`card card-item card-${item.type}`}>
      <div className="card-body">
        <div className="card-head">
          <span className={`item-icon icon-${item.type}`}>
            <TypeIcon type={item.type} size={20} />
          </span>
          <div className="card-titles">
            <h3>
              <a className="stretched" href={href({ page: 'item', id: item.id })}>
                {item.name}
              </a>
            </h3>
            <span className="author">{item.author}</span>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <p className="tagline">{item.tagline}</p>
        <div className="card-foot">
          <div className="tags">
            <TypePill type={item.type} />
            {item.tags.slice(0, 2).map(t => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
          <InstallButton item={item} compact />
        </div>
      </div>
    </article>
  )
}

// A theme's stage is a desktop: the wallpaper itself, dimmed, with the windows on top.
export function stageBackground(from: string, to: string, wallpaper?: string | null): string {
  return wallpaper
    ? `linear-gradient(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.22)), url("${wallpaper}") center / cover no-repeat`
    : `radial-gradient(120% 90% at 0% 0%, ${from}, ${to})`
}

export function WallpaperCard({ wallpaper: w }: { wallpaper: Wallpaper }) {
  const choice = useWallChoice()
  const p = paletteById(w.pairs) ?? PALETTES[0]
  const inUse = typeof choice === 'object' && choice.id === w.id
  return (
    <article className="card card-wall">
      <div className="card-stage wall-stage" style={{ backgroundImage: `url("${w.thumb}")` }}>
        <TerminalPreview palette={p} className="wall-term" wallpaper={w.thumb} />
        <span className="wall-cat">{w.category}</span>
      </div>
      <div className="card-body">
        <div className="card-head">
          <h3>{w.name}</h3>
          <span className="mode-tag">{w.width >= 3840 ? '4K' : `${w.width}px`}</span>
        </div>
        <a className="credit" href={w.sourceUrl} target="_blank" rel="noreferrer">
          {w.author} · {w.license}
        </a>
        <div className="card-foot">
          <button className={`btn btn-sm ${inUse ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setWall(inUse ? 'auto' : toWall(w))} aria-pressed={inUse}>
            <ImageIcon size={14} /> {inUse ? 'Previewing' : 'Preview here'}
          </button>
          <div className="flex items-center gap-1.5">
            <a className="btn btn-ghost btn-sm" href={w.src} target="_blank" rel="noreferrer" aria-label={`Open ${w.name} at full size`}>
              <Download size={14} />
            </a>
            <button className="btn btn-primary btn-sm" onClick={() => copy(wallCommand(w.src), 'Wallpaper command copied')}>
              Use with Mantle
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
