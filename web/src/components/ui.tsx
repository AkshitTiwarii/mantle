import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { TYPE_LABEL } from '../lib/catalog'
import type { InstallStep, Item, ItemStatus, ItemType } from '../lib/catalog'

// ---- toasts -------------------------------------------------------------------

type Toast = { id: number; text: string; tone: 'ok' | 'error' }
let toasts: Toast[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())

export function toast(text: string, tone: Toast['tone'] = 'ok') {
  const id = Date.now() + Math.random()
  toasts = [...toasts, { id, text, tone }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    emit()
  }, 3200)
}

export function Toasts() {
  const list = useSyncExternalStore(
    l => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => toasts,
  )
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map(t => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}

export async function copy(text: string, what = 'Copied') {
  try {
    await navigator.clipboard.writeText(text)
    toast(`${what} to clipboard`)
  } catch {
    // Clipboard API needs a secure context; fall back to a hidden textarea.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    toast(ok ? `${what} to clipboard` : 'Copy failed; select the text instead', ok ? 'ok' : 'error')
  }
}

// ---- small pieces -----------------------------------------------------------------

export function TypeIcon({ type, size = 16 }: { type: ItemType; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  switch (type) {
    case 'theme':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="8.5" cy="10" r="1.3" fill="currentColor" />
          <circle cx="12" cy="7.5" r="1.3" fill="currentColor" />
          <circle cx="15.5" cy="10" r="1.3" fill="currentColor" />
          <path d="M12 21c-1.5 0-2-1-2-2s1-1.5 1-3-1.5-2-3-2" />
        </svg>
      )
    case 'skill':
      return (
        <svg {...common}>
          <path d="M5 4h10l4 4v12H5z" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      )
    case 'connector':
      return (
        <svg {...common}>
          <path d="M8 3v4M16 3v4" />
          <path d="M6 7h12v3a6 6 0 0 1-12 0z" />
          <path d="M12 16v5" />
        </svg>
      )
    case 'plugin':
      return (
        <svg {...common}>
          <path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4z" />
        </svg>
      )
  }
}

export function TypePill({ type }: { type: ItemType }) {
  return (
    <span className={`pill pill-${type}`}>
      <TypeIcon type={type} size={13} /> {TYPE_LABEL[type]}
    </span>
  )
}

const STATUS_COPY: Record<ItemStatus, { label: string; title: string }> = {
  mantle: { label: 'Mantle', title: 'Made by Mantle; needs the Mantle mod to apply live.' },
  verified: { label: 'Public repo', title: 'A real public project. The repo and install command were checked when this listing was written.' },
  placeholder: { label: 'Placeholder', title: 'Sample listing. Not a real, installable item.' },
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  const s = STATUS_COPY[status]
  return (
    <span className={`badge badge-${status}`} title={s.title}>
      {s.label}
    </span>
  )
}

export function CopyField({ step, index }: { step: InstallStep; index?: number }) {
  return (
    <div className="copyfield">
      <div className="copyfield-label">
        {index !== undefined && <span className="step-num">{index + 1}</span>}
        {step.label}
        <span className="where">{step.where === 'terminal' ? 'system terminal' : 'Claude Code prompt'}</span>
      </div>
      <div className="copyfield-row">
        <code>{step.command}</code>
        <button className="btn btn-ghost btn-sm" onClick={() => copy(step.command, 'Command copied')}>
          Copy
        </button>
      </div>
    </div>
  )
}

// One click copies a single-step install; multi-step installs open the steps
// so they run in order (two slash commands can't be pasted as one prompt).
export function InstallButton({ item, compact }: { item: Item; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  // Open toward the side with room: left-aligned near the left edge, below
  // when there isn't space above.
  const [place, setPlace] = useState({ left: false, below: false })
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const placeholder = item.status === 'placeholder'
  const single = item.install.length === 1
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (single && !placeholder) {
      copy(item.install[0].command, `${item.install[0].command.split(' ').slice(0, 2).join(' ')} copied`)
      return
    }
    const r = ref.current?.getBoundingClientRect()
    if (r) setPlace({ left: r.right < Math.min(470, window.innerWidth * 0.86 + 16), below: r.top < 80 + item.install.length * 88 })
    setOpen(o => !o)
  }
  return (
    <div className="install" ref={ref} onClick={e => e.stopPropagation()}>
      <button className={`btn ${placeholder ? 'btn-ghost' : 'btn-primary'} ${compact ? 'btn-sm' : ''}`} onClick={onClick} aria-expanded={open}>
        {placeholder ? 'Preview install' : single ? 'Install' : `Install · ${item.install.length} steps`}
        {!single || placeholder ? <span aria-hidden> ▾</span> : <CopyGlyph />}
      </button>
      {open && (
        <div className={`popover ${place.left ? 'pop-left' : ''} ${place.below ? 'pop-below' : ''}`} role="dialog" aria-label={`Install ${item.name}`}>
          {placeholder && <p className="popover-note">Placeholder listing: these commands show the format and won't install anything.</p>}
          {item.install.map((s, i) => (
            <CopyField key={i} step={s} index={item.install.length > 1 ? i : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}

function CopyGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden style={{ marginLeft: 6 }}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  )
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
