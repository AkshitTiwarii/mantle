import { href, useRoute } from './lib/router'
import { useCompanion } from './components/ApplyTheme'
import { Toasts } from './components/ui'
import { Hub } from './pages/Hub'
import { Detail } from './pages/Detail'
import { Maker } from './pages/Maker'
import { MyClaude } from './pages/MyClaude'

export function App() {
  const route = useRoute()
  const [companion] = useCompanion()
  const nav = [
    { label: 'Gallery', to: href({ page: 'hub' }), on: route.page === 'hub' || route.page === 'item' },
    { label: 'Make a theme', to: href({ page: 'make' }), on: route.page === 'make' },
    { label: 'My Claude', to: href({ page: 'me' }), on: route.page === 'me', dot: companion },
  ]
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#/" aria-label="Mantle home">
          <MantleMark />
          <span>Mantle</span>
        </a>
        <nav>
          {nav.map(n => (
            <a key={n.label} href={n.to} className={n.on ? 'on' : ''} aria-current={n.on ? 'page' : undefined}>
              {n.label}
              {n.dot && <span className={`status-dot ${n.dot}`} title={n.dot === 'online' ? 'Local companion connected' : n.dot === 'offline' ? 'Local companion not running' : 'Checking…'} />}
            </a>
          ))}
        </nav>
      </header>
      <main>
        {route.page === 'hub' && <Hub />}
        {route.page === 'item' && <Detail key={route.id} id={route.id} />}
        {route.page === 'make' && <Maker key={route.from ?? ''} from={route.from} />}
        {route.page === 'me' && <MyClaude />}
      </main>
      <footer className="footer">
        <span>
          <b>Mantle</b> · themes, skills, connectors and plugins for Claude.
        </span>
        <span className="muted">An independent project, not affiliated with Anthropic. Compatible with Claude Code, claude.ai and Windows Terminal.</span>
      </footer>
      <Toasts />
    </>
  )
}

function MantleMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="mm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset=".5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#ff4fd8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#141821" />
      <path d="M6 23 L11 9 L16 18 L21 9 L26 23" fill="none" stroke="url(#mm)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
