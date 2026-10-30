import { ImagePlus } from 'lucide-react'
import { WALLPAPERS } from '../lib/wallpapers'
import { attachOwn, setWall, toWall, useWallChoice } from '../lib/wallpaper'

// A varied first row: take wallpapers round-robin across categories.
const FEATURED = (() => {
  const byCat = new Map<string, typeof WALLPAPERS>()
  for (const w of WALLPAPERS) byCat.set(w.category, [...(byCat.get(w.category) ?? []), w])
  const lists = [...byCat.values()]
  const out: typeof WALLPAPERS = []
  for (let i = 0; out.length < 10 && lists.some(l => l[i]); i++) for (const l of lists) if (l[i] && out.length < 10) out.push(l[i])
  return out
})()

// Pick the wallpaper every preview on the site shows, or attach your own image.
export function WallpaperPicker({ more = true }: { more?: boolean }) {
  const choice = useWallChoice()
  const id = typeof choice === 'object' ? choice.id : choice
  const own = typeof choice === 'object' && choice.own ? choice : null
  return (
    <div className="wall-picker" role="radiogroup" aria-label="Wallpaper">
      <span className="wall-picker-label">Wallpaper</span>
      <button role="radio" aria-checked={id === 'auto'} className={`wp-chip wp-text ${id === 'auto' ? 'on' : ''}`} onClick={() => setWall('auto')}>
        Matched
      </button>
      <button role="radio" aria-checked={id === 'none'} className={`wp-chip wp-text ${id === 'none' ? 'on' : ''}`} onClick={() => setWall('none')}>
        None
      </button>
      {FEATURED.map(w => (
        <button
          key={w.id}
          role="radio"
          aria-checked={id === w.id}
          aria-label={w.name}
          title={w.name}
          className={`wp-chip ${id === w.id ? 'on' : ''}`}
          style={{ backgroundImage: `url("${w.thumb}")` }}
          onClick={() => setWall(toWall(w))}
        />
      ))}
      {own && <span className="wp-chip on" title={own.name} style={{ backgroundImage: `url("${own.thumb}")` }} />}
      <label className="wp-chip wp-text wp-own" title="Use an image from your computer. It stays in this tab.">
        <ImagePlus size={15} /> Your own
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) attachOwn(f)
            e.target.value = ''
          }}
        />
      </label>
      {more && (
      <button type="button" className="wp-more" onClick={() => document.getElementById('wallpapers')?.scrollIntoView({ behavior: 'smooth' })}>
        All {WALLPAPERS.length} wallpapers
      </button>
      )}
    </div>
  )
}

