import { useEffect, useState } from 'react'
import { ATLAS_KINDS } from './atlas'
import type { AtlasKind } from './atlas'

// Clean paths: /, /item/<id>, /make, /me, /explore?q=jira&t=connectors.
// The build writes a real page for each route (see vite.config.ts), so a
// static host serves them without rewrites; links are pushed with the
// History API, and old #/ links are redirected on load.
export type Route =
  | { page: 'hub' }
  | { page: 'item'; id: string }
  | { page: 'make'; from?: string; share?: string }
  | { page: 'me' }
  | { page: 'explore'; q?: string; t?: AtlasKind }

// `url` is a path with an optional query: "/explore?q=jira".
export function parse(url: string): Route {
  const [path, query = ''] = url.split('?')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'item' && parts[1]) return { page: 'item', id: decodeURIComponent(parts[1]) }
  if (parts[0] === 'make') {
    const q = new URLSearchParams(query)
    return { page: 'make', from: q.get('from') ?? undefined, share: q.get('t') ?? undefined }
  }
  if (parts[0] === 'me') return { page: 'me' }
  if (parts[0] === 'explore') {
    const q = new URLSearchParams(query)
    const t = q.get('t') as AtlasKind | null
    return { page: 'explore', q: q.get('q') ?? undefined, t: t && ATLAS_KINDS.includes(t) ? t : undefined }
  }
  return { page: 'hub' }
}

export function href(route: Route): string {
  switch (route.page) {
    case 'item':
      return `/item/${encodeURIComponent(route.id)}`
    case 'make':
      if (route.share) return `/make?t=${route.share}`
      return route.from ? `/make?from=${encodeURIComponent(route.from)}` : '/make'
    case 'me':
      return '/me'
    case 'explore': {
      // Skills are the default type, so they stay out of the link.
      const q = new URLSearchParams()
      if (route.q?.trim()) q.set('q', route.q.trim())
      if (route.t && route.t !== 'skills') q.set('t', route.t)
      return q.toString() ? `/explore?${q}` : '/explore'
    }
    default:
      return '/'
  }
}

// The current location as parse() reads it. Strips the trailing slash the
// pre-rendered pages (/explore/index.html) may be served with.
export function current(): string {
  const path = location.pathname.replace(/\/index\.html$/, '').replace(/(.)\/$/, '$1')
  return path + location.search
}

export function navigate(to: string) {
  if (to === current()) return
  history.pushState(null, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// Links shared before clean paths (/#/explore?q=x) keep working.
function upgradeHashLink() {
  if (location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1) || '/')
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => {
    upgradeHashLink()
    return parse(current())
  })
  useEffect(() => {
    const onPop = () => {
      setRoute(parse(current()))
      window.scrollTo({ top: 0 })
    }
    // Same-site links navigate in place instead of reloading the page.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const raw = a.getAttribute('href')
      if (!raw || !raw.startsWith('/') || raw.startsWith('//') || /^\/(api|index|assets)\//.test(raw) || /\.\w+$/.test(raw.split('?')[0])) return
      e.preventDefault()
      navigate(raw)
    }
    // An old #/ link opened while the site is already loaded only changes the hash.
    const onHash = () => {
      if (!location.hash.startsWith('#/')) return
      upgradeHashLink()
      onPop()
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onHash)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('hashchange', onHash)
      document.removeEventListener('click', onClick)
    }
  }, [])
  return route
}
