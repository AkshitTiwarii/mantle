import type { CSSProperties } from 'react'
import { claudeCodeTheme, mix, stateColor, webVars } from '../lib/palettes.js'
import type { LiveState, Palette } from '../lib/palettes.js'

// Mock surfaces rendered straight from a palette with the same functions the
// Mantle mod uses, so what you see here is what gets written. Sizes are in em:
// set `fontSize` on the wrapper to scale a preview.

type PreviewProps = { palette: Palette; state?: LiveState; style?: CSSProperties; className?: string }

const STATE_LINE: Record<LiveState, { glyph: string; text: string }> = {
  idle: { glyph: '●', text: 'Ready' },
  thinking: { glyph: '∗', text: 'Thinking…' },
  working: { glyph: '⏺', text: 'Running Bash(npm test)…' },
  plan: { glyph: '⏸', text: 'Planning the refactor…' },
  done: { glyph: '✓', text: 'Done in 12s' },
  error: { glyph: '✗', text: 'Bash failed: exit code 1' },
}

export function TerminalPreview({ palette: p, state = 'idle', style, className }: PreviewProps) {
  const o = claudeCodeTheme(p, { state }).overrides
  const line = STATE_LINE[state]
  const live = stateColor(p, state)
  return (
    <div className={`mock mock-term ${className ?? ''}`} style={{ background: p.bg, color: o.text, borderColor: mix(p.border, p.bg, 0.3), ...style }}>
      <div className="mock-bar" style={{ background: mix(p.bg, p.text, 0.06), borderColor: mix(p.border, p.bg, 0.4) }}>
        <span className="dots" aria-hidden>
          <i style={{ background: mix(p.error, p.bg, 0.25) }} />
          <i style={{ background: mix(p.warning, p.bg, 0.25) }} />
          <i style={{ background: mix(p.success, p.bg, 0.25) }} />
        </span>
        <span className="mock-title" style={{ color: o.inactive }}>claude · ~/acme-app</span>
      </div>
      <div className="term-body">
        <div className="term-welcome" style={{ borderColor: o.claude }}>
          <span style={{ color: o.claude }}>▌</span> {p.name} <span style={{ color: o.inactive }}>· Mantle</span>
        </div>
        <div className="term-user" style={{ background: o.userMessageBackground }}>
          <span style={{ color: o.inactive }}>&gt;</span> make the login form remember the email
        </div>
        <div>
          <span style={{ color: o.success }}>⏺</span> Read<span style={{ color: o.inactive }}>(src/LoginForm.tsx)</span>
        </div>
        <div className="term-indent" style={{ color: o.inactive }}>⎿ Read 84 lines</div>
        <div>
          <span style={{ color: o.success }}>⏺</span> Update<span style={{ color: o.inactive }}>(src/LoginForm.tsx)</span>
        </div>
        <div className="term-diff">
          <div style={{ background: o.diffRemoved }}>
            <span style={{ color: o.error }}>-</span> const [email, setEmail] = useState(<span style={{ color: o.warning }}>''</span>)
          </div>
          <div style={{ background: o.diffAdded }}>
            <span style={{ color: o.success }}>+</span> const [email, setEmail] = useStored(<span style={{ color: o.warning }}>'email'</span>)
          </div>
        </div>
        <div className={`term-state ${state === 'thinking' || state === 'working' ? 'shimmer' : ''}`} style={{ color: live, ['--live' as string]: live, ['--shimmer' as string]: o.claudeShimmer }}>
          {line.glyph} {line.text}
        </div>
        <div className="term-prompt" style={{ borderColor: o.promptBorder }}>
          <span style={{ color: o.inactive }}>&gt;</span> <span className="caret" style={{ background: o.text }} />
        </div>
        <div className="term-foot">
          {state === 'plan' ? (
            <span style={{ color: o.planMode }}>⏸ plan mode on</span>
          ) : (
            <span style={{ color: o.autoAccept }}>⏵⏵ accept edits on</span>
          )}
          <span style={{ color: o.inactive }}> · shift+tab to cycle</span>
        </div>
      </div>
    </div>
  )
}

export function ChatPreview({ palette: p, state = 'idle', style, className }: PreviewProps) {
  const v = webVars(p, { accent: state === 'idle' ? undefined : stateColor(p, state) })
  return (
    <div className={`mock mock-chat ${className ?? ''}`} style={{ background: v['--cds-page-bg'], color: v['--cds-text-primary'], borderColor: v['--cds-border'], ...style }}>
      <div className="chat-side" style={{ background: v['--cds-surface-0'], borderColor: v['--cds-border'] }}>
        <div className="chat-new" style={{ background: v['--cds-bg-accent'], color: v['--cds-text-accent'] }}>+ New chat</div>
        {[0.9, 0.7, 0.8, 0.55].map((w, i) => (
          <div key={i} className="chat-row" style={{ width: `${w * 100}%`, background: i === 0 ? v['--cds-surface-3'] : v['--cds-surface-2'] }} />
        ))}
      </div>
      <div className="chat-main">
        <div className="chat-head" style={{ color: v['--cds-text-secondary'], borderColor: v['--cds-border'] }}>
          Theme ideas <span style={{ color: v['--cds-text-muted'] }}>▾</span>
        </div>
        <div className="chat-msgs">
          <div className="chat-user" style={{ background: v['--cds-surface-3'] }}>Can you suggest a calmer palette?</div>
          <div className="chat-bot">
            <span className="chat-dot" style={{ background: v['--cds-fill-accent'] }} />
            <div>
              <p>Try lowering saturation on the accent and lifting the surfaces slightly.</p>
              <p style={{ color: v['--cds-text-secondary'] }}>
                Use <code style={{ background: v['--cds-surface-2'], color: v['--cds-text-accent'] }}>{p.accent}</code> for links.
              </p>
            </div>
          </div>
        </div>
        <div className="chat-input" style={{ background: v['--cds-surface-2'], borderColor: v['--cds-border-strong'] }}>
          <span style={{ color: v['--cds-text-muted'] }}>Reply…</span>
          <span className="chat-send" style={{ background: v['--cds-fill-accent'], color: v['--cds-on-accent'] }}>↑</span>
        </div>
      </div>
    </div>
  )
}

export function TerminalSwatch({ palette: p, style, className }: PreviewProps) {
  const a = p.ansi
  return (
    <div className={`mock mock-wt ${className ?? ''}`} style={{ background: p.bg, color: p.text, borderColor: mix(p.border, p.bg, 0.3), ...style }}>
      <div className="wt-tabs" style={{ background: mix(p.bg, '#000000', 0.25) }}>
        <span className="wt-tab" style={{ background: p.bg, color: p.text }}>
          <span style={{ color: p.accent }}>◆</span> Claude · Mantle
        </span>
        <span style={{ color: p.muted }}>+</span>
      </div>
      <div className="wt-body">
        <div>
          <span style={{ color: a[2] }}>PS</span> <span style={{ color: a[4] }}>C:\dev\acme-app</span>
          <span style={{ color: a[5] }}> git:(main)</span> <span>&gt; git status --short</span>
        </div>
        <div>
          <span style={{ color: a[3] }}> M</span> src/LoginForm.tsx
        </div>
        <div>
          <span style={{ color: a[2] }}>??</span> src/useStored.ts
        </div>
        <div>
          <span style={{ color: a[1] }}> D</span> <span style={{ color: a[8] }}>legacy/session.js</span>
        </div>
        <div className="wt-grid" aria-label="ANSI colors">
          {a.map((c, i) => (
            <span key={i} title={`${i < 8 ? 'normal' : 'bright'} ${i % 8}: ${c}`} style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// A thin row of a palette's key colors.
export function PaletteStrip({ palette: p, className }: { palette: Palette; className?: string }) {
  const colors = [p.bg, p.surface, p.surfaceAlt, p.accent, p.accent2, p.info, p.success, p.warning, p.error, p.text]
  return (
    <div className={`strip ${className ?? ''}`} aria-hidden>
      {colors.map((c, i) => (
        <span key={i} style={{ background: c }} />
      ))}
    </div>
  )
}
