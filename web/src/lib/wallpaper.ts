import { useSyncExternalStore } from 'react'
import { WALLPAPERS } from './wallpapers'
import type { Wallpaper } from './wallpapers'

// The wallpaper every preview on the site shows. 'auto' gives each theme its
// paired wallpaper; a gallery pick persists by id; an image the visitor
// attaches stays in this tab (an object URL, never uploaded).
export type Wall = { id: string; name: string; src: string; thumb: string; own?: boolean }
export type WallChoice = Wall | 'none' | 'auto'

const KEY = 'mantle.wallpaper'
let current: WallChoice | undefined
const listeners = new Set<() => void>()

export function toWall(w: Wallpaper): Wall {
  return { id: w.id, name: w.name, src: w.src, thumb: w.thumb }
}

function initial(): WallChoice {
  try {
    const id = localStorage.getItem(KEY)
    if (id === 'none') return 'none'
    const w = WALLPAPERS.find(x => x.id === id)
    return w ? toWall(w) : 'auto'
  } catch {
    return 'auto'
  }
}

function read(): WallChoice {
  if (current === undefined) current = initial()
  return current
}

export function setWall(next: WallChoice) {
  const prev = read()
  if (typeof prev === 'object' && prev.own && (typeof next !== 'object' || prev.src !== next.src)) URL.revokeObjectURL(prev.src)
  current = next
  try {
    if (typeof next === 'string') localStorage.setItem(KEY, next)
    else if (!next.own) localStorage.setItem(KEY, next.id)
  } catch {}
  listeners.forEach(l => l())
}

export function attachOwn(file: File): Wall {
  const src = URL.createObjectURL(file)
  const wall = { id: 'own', name: file.name.replace(/\.[^.]+$/, ''), src, thumb: src, own: true }
  setWall(wall)
  return wall
}

export function useWallChoice(): WallChoice {
  return useSyncExternalStore(
    l => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    read,
  )
}

// The wallpaper a theme is shown with when the visitor has not picked one.
export function pairedWall(paletteId: string): Wall | null {
  const w = WALLPAPERS.find(x => x.pairs === paletteId)
  return w ? toWall(w) : null
}

export function resolveWall(choice: WallChoice, paletteId: string): Wall | null {
  if (choice === 'none') return null
  if (choice === 'auto') return pairedWall(paletteId)
  return choice
}

// The wallpaper for a palette, following the visitor's choice.
export function useWall(paletteId: string): Wall | null {
  return resolveWall(useWallChoice(), paletteId)
}

// The /mantle command that downloads a wallpaper and applies it to the terminal and claude.ai.
export function wallCommand(src: string): string {
  return `/mantle wallpaper ${src}`
}
