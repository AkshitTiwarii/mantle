import type { BaseColors } from './exports'
import { contrast } from './exports'

// Builds a theme from a picture: the background comes from the image's own
// shadows (or highlights, for light mode), the two accents from its most vivid
// hues, and the status colors keep their usual meaning but borrow the image's tint.

type HSL = [number, number, number]

function toHsl(r: number, g: number, b: number): HSL {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

export function hslHex([h, s, l]: HSL): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image'))
    img.src = src
  })
}

// Bucket pixels into a coarse color histogram (4 bits per channel).
async function swatches(src: string): Promise<{ hsl: HSL; count: number }[]> {
  const img = await loadImage(src)
  const size = 72
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = Math.max(1, Math.round((size * img.naturalHeight) / img.naturalWidth))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
    const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 }
    e.r += data[i]
    e.g += data[i + 1]
    e.b += data[i + 2]
    e.n++
    buckets.set(key, e)
  }
  return [...buckets.values()].map(e => ({ hsl: toHsl(e.r / e.n, e.g / e.n, e.b / e.n), count: e.n }))
}

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

// Status colors keep their meaning (green done, red error...) but lean toward
// the image's dominant hue a little so they sit in the same picture.
function status(hue: number, tint: number, dark: boolean, s = 0.62): string {
  const h = (hue + Math.sign(((tint - hue + 540) % 360) - 180) * 12 + 360) % 360
  return hslHex([h, s, dark ? 0.64 : 0.4])
}

export async function themeFromImage(src: string, mode: 'dark' | 'light', name: string): Promise<BaseColors> {
  const sw = await swatches(src)
  const total = sw.reduce((n, s) => n + s.count, 0)
  const dark = mode === 'dark'

  // Dominant tone: weight by population, favour the image's shadows (dark) or highlights (light).
  const base = sw
    .filter(s => (dark ? s.hsl[2] < 0.45 : s.hsl[2] > 0.55))
    .sort((a, b) => b.count - a.count)[0]?.hsl ?? [220, 0.2, dark ? 0.1 : 0.95]
  const [bh, bs] = base
  const bg = hslHex([bh, Math.min(bs, 0.45) * 0.8, dark ? 0.085 : 0.955])
  const text = hslHex([bh, Math.min(bs, 0.3) * 0.6, dark ? 0.9 : 0.14])

  // Vivid hues, scored by saturation and presence; the second accent must differ in hue.
  const vivid = sw
    .filter(s => s.hsl[1] > 0.28 && s.hsl[2] > 0.18 && s.hsl[2] < 0.86 && s.count / total > 0.002)
    .map(s => ({ ...s, score: s.hsl[1] * Math.sqrt(s.count / total) }))
    .sort((a, b) => b.score - a.score)
  const a1 = vivid[0]?.hsl ?? [(bh + 160) % 360, 0.7, 0.6]
  const a2 = vivid.find(v => hueGap(v.hsl[0], a1[0]) > 40)?.hsl ?? [(a1[0] + 60) % 360, 0.65, 0.62]

  // Push accents to a readable lightness against the new background.
  const readable = ([h, s]: HSL): string => {
    let l = dark ? 0.62 : 0.42
    let hex = hslHex([h, Math.max(s, 0.55), l])
    for (let i = 0; i < 8 && contrast(hex, bg) < (dark ? 4 : 3.6); i++) {
      l += dark ? 0.04 : -0.04
      hex = hslHex([h, Math.max(s, 0.55), l])
    }
    return hex
  }

  return {
    name,
    mode,
    bg,
    text,
    accent: readable(a1),
    accent2: readable(a2),
    info: status(210, a1[0], dark, 0.7),
    warning: status(42, a1[0], dark, 0.82),
    success: status(135, a1[0], dark, 0.48),
    error: status(4, a1[0], dark, 0.72),
  }
}
