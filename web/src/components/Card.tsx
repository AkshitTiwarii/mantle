import { useEffect, useState } from 'react'
import { LIVE_STATES } from '../lib/palettes.js'
import type { LiveState } from '../lib/palettes.js'
import type { Item } from '../lib/catalog'
import { href } from '../lib/router'
import { ChatPreview, PaletteStrip, TerminalPreview } from './Previews'
import { InstallButton, StatusBadge, TypeIcon, TypePill } from './ui'

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
  return (
    <article
      className="card card-theme"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{ ['--card-accent' as string]: p.accent }}
    >
      <div className="card-stage" style={{ background: `radial-gradient(120% 90% at 0% 0%, ${p.surfaceAlt}, ${p.bg})` }}>
        <TerminalPreview palette={p} state={state} className="stage-term" />
        <ChatPreview palette={p} state={state} className="stage-chat" />
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
