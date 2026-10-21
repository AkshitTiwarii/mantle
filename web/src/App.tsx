import { useState } from 'react'
import { MotionConfig } from 'motion/react'
import { PageTransition } from './components/Motion'
import { IconBrandGithub as Github } from '@tabler/icons-react'
import { href, useRoute } from './lib/router'
import { HOSTED, useCompanion } from './components/ApplyTheme'
import { Toasts, copy } from './components/ui'
import { MobileNav, MobileNavHeader, MobileNavMenu, MobileNavToggle, NavBody, NavItems, Navbar, NavbarButton } from './components/ui/resizable-navbar'
import { Hub } from './pages/Hub'
import { Detail } from './pages/Detail'
import { Maker } from './pages/Maker'
import { MyClaude } from './pages/MyClaude'

export const REPO_URL = 'https://github.com/AkshitTiwarii/mantle'
export const INSTALL_COMMAND = '/plugin install mantle --marketplace AkshitTiwarii/mantle'

export function App() {
  const route = useRoute()
  const [companion] = useCompanion()
  const [menuOpen, setMenuOpen] = useState(false)
  const companionTitle = companion === 'online' ? 'Local companion connected' : companion === 'offline' ? 'Local companion not running' : 'Checking…'
  const items = [
    { name: 'Gallery', link: href({ page: 'hub' }) },
    { name: 'Make a theme', link: href({ page: 'make' }) },
    { name: 'My Claude', link: href({ page: 'me' }) },
  ]
  const install = () => copy(INSTALL_COMMAND, 'Install command copied')

  return (
    <div className="sheet">
      <Navbar className="top-3 pt-3">
        <NavBody className="px-3">
          <a className="brand" href="#/" aria-label="Mantle home">
            <MantleMark />
            Mantle
          </a>
          <NavItems items={items} className="text-[14px] [&_a]:!text-[var(--text-2)] [&_.bg-gray-100]:!bg-[var(--panel-3)]" />
          <div className="relative z-20 flex items-center gap-2">
            {!HOSTED && <span className={`nav-dot ${companion}`} title={companionTitle} aria-label={companionTitle} />}
            <NavbarButton href={REPO_URL} target="_blank" rel="noreferrer" variant="secondary" className="!px-3 !font-semibold">
              <Github size={16} className="mr-1.5 inline -translate-y-px" />
              GitHub
            </NavbarButton>
            <NavbarButton as="button" variant="dark" onClick={install} className="!rounded-[10px]">
              Install Mantle
            </NavbarButton>
          </div>
        </NavBody>
        <MobileNav>
          <MobileNavHeader className="px-1">
            <a className="brand" href="#/" aria-label="Mantle home">
              <MantleMark />
              Mantle
            </a>
            <MobileNavToggle isOpen={menuOpen} onClick={() => setMenuOpen(o => !o)} />
          </MobileNavHeader>
          <MobileNavMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
            {items.map(i => (
              <a key={i.name} href={i.link} onClick={() => setMenuOpen(false)} className="w-full text-[17px] text-[var(--text)] no-underline">
                {i.name}
              </a>
            ))}
            <NavbarButton as="button" variant="dark" onClick={install} className="w-full">
              Install Mantle
            </NavbarButton>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      <main>
        <MotionConfig reducedMotion="user">
          <PageTransition id={route.page === 'item' ? `item:${route.id}` : route.page}>
            {route.page === 'hub' && <Hub />}
            {route.page === 'item' && <Detail id={route.id} />}
            {route.page === 'make' && <Maker key={route.from ?? ''} from={route.from} share={route.share} />}
            {route.page === 'me' && <MyClaude />}
          </PageTransition>
        </MotionConfig>
      </main>
      <div className="rule" />
      <footer className="footer">
        <div>
          <a className="brand" href="#/">
            Mantle
          </a>
          <p>Themes, skills, connectors and plugins for Claude, in one place. An independent project, not affiliated with Anthropic.</p>
        </div>
        <nav aria-label="Footer">
          <a href={href({ page: 'hub' })}>Gallery</a>
          <a href={href({ page: 'make' })}>Make a theme</a>
          <a href={href({ page: 'me' })}>My Claude</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            MIT license
          </a>
        </nav>
      </footer>
      <Toasts />
    </div>
  )
}

// A cloak's fold: two strokes that meet like the M of a draped mantle, with
// the brand green as the lining.
export function MantleMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#0a0a0a" />
      <path d="M8 23V10.5c0-.9 1.1-1.3 1.7-.6L16 17l6.3-7.1c.6-.7 1.7-.3 1.7.6V23" fill="none" stroke="#fffaf0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17v6" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
