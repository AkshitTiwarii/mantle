import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ThemeFile } from '../lib/api'
import type { Palette } from '../lib/palettes.js'
import { Modal, toast } from './ui'

export type CompanionState = 'checking' | 'online' | 'offline'

// On the hosted site (Vercel) there is no companion to reach: it only ever runs
// on the visitor's own machine, so skip the request and show setup steps instead.
export const HOSTED = typeof location !== 'undefined' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)

let cached: Promise<boolean> | undefined

// Whether the local companion answers. Checked once per page load; `retry`
// checks again (e.g. after the person starts it).
export function useCompanion(): [CompanionState, () => void] {
  const [state, setState] = useState<CompanionState>('checking')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    if (!cached || tick) cached = HOSTED ? Promise.resolve(false) : api.health().then(() => true, () => false)
    cached.then(ok => live && setState(ok ? 'online' : 'offline'))
    return () => {
      live = false
    }
  }, [tick])
  return [
    state,
    () => {
      setState('checking')
      setTick(t => t + 1)
    },
  ]
}

type Target = { paletteId: string } | { palette: Palette }

export function ApplyThemeButton({ target, name, className = 'btn btn-secondary' }: { target: Target; name: string; className?: string }) {
  const [companion] = useCompanion()
  const [open, setOpen] = useState(false)
  if (companion !== 'online') {
    return (
      <a className={className} href="#/me" title="Start the local companion (npm run dev) to apply themes on this computer">
        Apply on this computer…
      </a>
    )
  }
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        Apply on this computer…
      </button>
      {open && <ApplyDialog target={target} name={name} onClose={() => setOpen(false)} />}
    </>
  )
}

function ApplyDialog({ target, name, onClose }: { target: Target; name: string; onClose: () => void }) {
  const [file, setFile] = useState<ThemeFile>()
  const [phase, setPhase] = useState<'confirm' | 'writing' | 'done' | 'undone'>('confirm')
  const [error, setError] = useState<string>()
  const [canUndo, setCanUndo] = useState(false)

  useEffect(() => {
    api.themeFile().then(setFile, e => setError(String(e.message ?? e)))
  }, [])

  const apply = async () => {
    setPhase('writing')
    setError(undefined)
    try {
      const r = await api.apply(target)
      setCanUndo(r.canUndo)
      setPhase('done')
      toast(`${r.palette} written to ${r.file}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('confirm')
    }
  }

  const undo = async () => {
    try {
      await api.undo()
      setPhase('undone')
      toast('Previous mantle.json restored')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Modal title={phase === 'done' ? 'Theme written' : phase === 'undone' ? 'Restored' : `Apply ${name}?`} onClose={onClose}>
      {phase === 'confirm' || phase === 'writing' ? (
        <>
          <p>This writes one file on this computer and changes nothing else:</p>
          <code className="block">{file?.file ?? '~/.claude/themes/mantle.json'}</code>
          <ul className="facts">
            <li>
              {file?.exists ? (
                <>
                  It replaces the current <b>{file.name ?? 'unnamed theme'}</b>. You can undo right after.
                </>
              ) : (
                <>The file doesn't exist yet; it will be created.</>
              )}
            </li>
            <li>
              Claude Code shows it once <b>Mantle (live)</b> is picked in <code>/theme</code>.
            </li>
            <li>If the Mantle mod is running with live colors on, it rewrites this file at its next state change.</li>
          </ul>
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={apply} disabled={phase === 'writing' || !file}>
              {phase === 'writing' ? 'Writing…' : 'Write mantle.json'}
            </button>
          </div>
        </>
      ) : phase === 'done' ? (
        <>
          <p>
            <b>{name}</b> is in <code>{file?.file}</code>. In Claude Code, run <code>/theme</code> and pick <b>Mantle (live)</b> if it isn't selected.
          </p>
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            {canUndo && (
              <button className="btn btn-ghost" onClick={undo}>
                Undo
              </button>
            )}
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          <p>The previous mantle.json is back.</p>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
