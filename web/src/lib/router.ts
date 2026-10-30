import { useEffect, useState } from 'react'
import { ATLAS_KINDS } from './atlas'
import type { AtlasKind } from './atlas'

// Hash routes keep the app a static bundle: #/, #/item/<id>, #/make, #/me,
// #/explore?q=jira&t=connectors.
export type Route =
  | { page: 'hub' }
  | { page: 'item'; id: string }
  | { page: 'make'; from?: string; share?: string }
  | { page: 'me' }
  | { page: 'explore'; q?: string; t?: AtlasKind }

export function parse(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
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
      return `#/item/${encodeURIComponent(route.id)}`
    case 'make':
      if (route.share) return `#/make?t=${route.share}`
      return route.from ? `#/make?from=${encodeURIComponent(route.from)}` : '#/make'
    case 'me':
      return '#/me'
    case 'explore': {
      // Skills are the default type, so they stay out of the link.
      const q = new URLSearchParams()
      if (route.q?.trim()) q.set('q', route.q.trim())
      if (route.t && route.t !== 'skills') q.set('t', route.t)
      return q.toString() ? `#/explore?${q}` : '#/explore'
    }
    default:
      return '#/'
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const onHash = () => {
      setRoute(parse(location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}
