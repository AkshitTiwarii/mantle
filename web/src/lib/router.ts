import { useEffect, useState } from 'react'

// Hash routes keep the app a static bundle: #/, #/item/<id>, #/make, #/me.
export type Route =
  | { page: 'hub' }
  | { page: 'item'; id: string }
  | { page: 'make'; from?: string; share?: string }
  | { page: 'me' }

export function parse(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'item' && parts[1]) return { page: 'item', id: decodeURIComponent(parts[1]) }
  if (parts[0] === 'make') {
    const q = new URLSearchParams(query)
    return { page: 'make', from: q.get('from') ?? undefined, share: q.get('t') ?? undefined }
  }
  if (parts[0] === 'me') return { page: 'me' }
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
