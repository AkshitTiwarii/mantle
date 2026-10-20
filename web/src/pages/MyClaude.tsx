import { Lock } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'
import type { LocalConnector, LocalPlugin, LocalScan, LocalSkill } from '../lib/api'
import { PALETTES } from '../lib/palettes.js'
import { href } from '../lib/router'
import { ApplyThemeButton, useCompanion } from '../components/ApplyTheme'
import { CopyField, TypeIcon } from '../components/ui'
import type { ItemType } from '../lib/catalog'

export function MyClaude() {
  const [companion, retry] = useCompanion()
  const [scan, setScan] = useState<LocalScan>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      setScan(await api.local())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (companion === 'online') load()
  }, [companion, load])

  return (
    <div className="page me">
      <header className="page-head me-head">
        <div>
          <h1>Your setup, in one view</h1>
          <p className="lede">
            Read from <code>{scan?.claudeDir ?? '~/.claude'}</code> by the local companion. Nothing is sent anywhere but this browser tab, and secrets in connector configs are
            masked before they leave the companion.
          </p>
        </div>
        {companion === 'online' && (
          <div className="me-actions">
            <button className="btn btn-secondary" onClick={load} disabled={loading}>
              {loading ? 'Scanning…' : 'Rescan'}
            </button>
            {scan && <span className="muted small">Scanned {new Date(scan.generatedAt).toLocaleTimeString()}</span>}
          </div>
        )}
      </header>

      {companion === 'checking' && <div className="panel skeleton">Looking for the local companion…</div>}
      {companion === 'offline' && <Offline onRetry={retry} />}
      {error && <div className="panel error-text">Couldn't read the local setup: {error}</div>}

      {scan && <Dashboard scan={scan} query={query} setQuery={setQuery} />}
    </div>
  )
}

function Offline({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="panel offline">
      <h2>The local companion isn't running</h2>
      <p>
        My Claude needs the small companion server that ships with Mantle. It listens on <code>127.0.0.1</code> only and reads your Claude folder read-only. Start the app with:
      </p>
      <CopyField step={{ label: 'In the Mantle web folder', command: 'npm run dev', where: 'terminal' }} />
      <p className="muted">That starts the website and the companion together. Or run just the companion with <code>npm run dev:companion</code>.</p>
      <button className="btn btn-primary" onClick={onRetry}>
        Check again
      </button>
    </div>
  )
}

const match = (q: string, ...fields: (string | undefined)[]) => !q || fields.some(f => f?.toLowerCase().includes(q))

function Dashboard({ scan, query, setQuery }: { scan: LocalScan; query: string; setQuery: (q: string) => void }) {
  const q = query.trim().toLowerCase()
  const plugins = scan.plugins.filter(p => match(q, p.name, p.description, p.marketplace, ...p.skills, ...p.connectors))
  const skills = scan.skills.filter(s => match(q, s.name, s.description, s.origin))
  const connectors = scan.connectors.filter(c => match(q, c.name, c.origin, c.command, c.url))
  const themes = scan.themes.filter(t => match(q, t.name, t.slug))
  const marketplaces = scan.marketplaces.filter(m => match(q, m.name, m.repo))

  const tiles: { id: string; type?: ItemType; label: string; n: number }[] = [
    { id: 'themes', type: 'theme', label: 'Themes', n: scan.themes.length },
    { id: 'plugins', type: 'plugin', label: 'Plugins', n: scan.plugins.length },
    { id: 'skills', type: 'skill', label: 'Skills', n: scan.skills.length },
    { id: 'connectors', type: 'connector', label: 'Connectors', n: scan.connectors.length },
    { id: 'marketplaces', label: 'Marketplaces', n: scan.marketplaces.length },
  ]

  return (
    <>
      <div className="tiles">
        {tiles.map(t => (
          <a key={t.id} className="tile" href={`#/me`} onClick={e => { e.preventDefault(); document.getElementById(`me-${t.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
            <span className="tile-n">{t.n}</span>
            <span className="tile-label">
              {t.type && <TypeIcon type={t.type} size={14} />} {t.label}
            </span>
          </a>
        ))}
      </div>

      <div className="me-toolbar">
        <label className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" placeholder="Filter your setup…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Filter your setup" />
        </label>
        {scan.model && <span className="muted small">Model setting: <code>{scan.model}</code></span>}
        {scan.activeTheme && <span className="muted small">Theme setting: <code>{scan.activeTheme}</code></span>}
      </div>

      {scan.warnings.length > 0 && (
        <ul className="warnings">
          {scan.warnings.map(w => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <MantlePanel scan={scan} />

      <Group id="themes" title="Themes" type="theme" count={themes.length} note="Custom Claude Code themes in ~/.claude/themes.">
        {themes.length === 0 ? (
          <Empty>
            No custom themes yet. <a href="#/">Pick one from the gallery</a> or <a href={href({ page: 'make' })}>make your own</a>.
          </Empty>
        ) : (
          <div className="rows">
            {themes.map(t => (
              <div key={t.slug} className="row-item">
                <div className="swatches">
                  {t.swatch.slice(0, 8).map((c, i) => (
                    <span key={i} style={{ background: c }} />
                  ))}
                </div>
                <div className="row-main">
                  <b>{t.name}</b> {t.isMantle && <span className="badge badge-mantle">Mantle</span>} {t.active && <span className="badge badge-on">In use</span>}
                  <div className="muted small">
                    <code>{t.file}</code> · {t.base ?? 'no base'} · {t.tokenCount} tokens{!t.valid && ' · invalid JSON'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Group>

      <Group id="plugins" title="Plugins" type="plugin" count={plugins.length} note="Installed from marketplaces, plus plugins synced from your account.">
        <PluginList title="From marketplaces" plugins={plugins.filter(p => p.origin === 'marketplace')} />
        <PluginList title="Synced from your account" plugins={plugins.filter(p => p.origin === 'account')} />
      </Group>

      <Group id="skills" title="Skills" type="skill" count={skills.length} note="Personal skills, account skills, and skills that come with plugins.">
        <SkillList skills={skills} />
      </Group>

      <Group id="connectors" title="Connectors" type="connector" count={connectors.length} note="MCP servers by where they are configured. Env values, headers, tokens and URL query values are masked.">
        <ConnectorList connectors={connectors} />
      </Group>

      <Group id="marketplaces" title="Marketplaces" count={marketplaces.length} note="Plugin marketplaces Claude Code knows about.">
        {marketplaces.length === 0 ? (
          <Empty>No marketplaces added.</Empty>
        ) : (
          <div className="rows">
            {marketplaces.map(m => (
              <div key={m.name} className="row-item">
                <div className="row-main">
                  <b>{m.name}</b> <span className="muted small">{m.source}</span>
                  <div className="muted small">
                    <code>{m.repo ?? 'unknown source'}</code>
                    {m.lastUpdated && <> · updated {new Date(m.lastUpdated).toLocaleDateString()}</>}
                    {m.inSettings && ' · declared in settings'}
                    {!m.cloned && ' · not fetched yet'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Group>
    </>
  )
}

function Group({ id, title, type, count, note, children }: { id: string; title: string; type?: ItemType; count: number; note: string; children: ReactNode }) {
  return (
    <section className="group" id={`me-${id}`}>
      <div className="group-head">
        <h2>
          {type && <TypeIcon type={type} size={18} />} {title} <span className="count">{count}</span>
        </h2>
        <p className="muted">{note}</p>
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="empty-row">{children}</div>
}

function MantlePanel({ scan }: { scan: LocalScan }) {
  const m = scan.mantle
  const [preset, setPreset] = useState(m.studio?.preset ?? 'aurora')
  const p = PALETTES.find(x => x.id === preset) ?? PALETTES[0]
  const surfaces: { label: string; ok: boolean; detail: ReactNode }[] = [
    {
      label: 'Claude Code',
      ok: !m.code.missing,
      detail: m.code.missing ? (
        <>No <code>themes/mantle.json</code> yet.</>
      ) : (
        <>
          <b>{m.code.name}</b> · {m.code.selected ? 'selected in /theme' : <>not selected; pick <b>Mantle (live)</b> in /theme</>}
        </>
      ),
    },
    {
      label: 'claude.ai',
      ok: !m.web.missing,
      detail: m.web.missing ? <>Extension payload not written yet.</> : <><b>{m.web.palette}</b>{m.web.wallpaper && <> · wallpaper: {m.web.wallpaper}</>}{m.web.reactive && ' · live'}</>,
    },
    {
      label: 'Windows Terminal',
      ok: !m.terminal.missing,
      detail: m.terminal.missing ? <>No Mantle profile fragment yet.</> : <><b>{m.terminal.profile}</b> · {m.terminal.scheme}{m.terminal.acrylic && ' · acrylic'}{m.terminal.wallpaper && ' · wallpaper'}</>,
    },
  ]
  return (
    <section className="panel mantle-panel" style={{ ['--m-accent' as string]: p.accent, ['--m-accent2' as string]: p.accent2 }}>
      <div className="mantle-panel-head">
        <div>
          <h2>Mantle</h2>
          <p className="muted">
            {m.studio ? (
              <>
                Studio preset <b>{m.studio.preset}</b>, live colors {m.studio.reactive ? 'on' : 'off'}. <span className="small">({m.studio.file})</span>
              </>
            ) : (
              <>No studio config found on disk. The mod keeps it in its own store until <code>/mantle apply</code> runs.</>
            )}
          </p>
        </div>
      </div>
      <div className="surfaces">
        {surfaces.map(s => (
          <div key={s.label} className={`surface ${s.ok ? 'ok' : ''}`}>
            <span className="dot" />
            <div>
              <b>{s.label}</b>
              <div className="muted small">{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="apply-row">
        <label className="field-inline">
          <span>Apply a Mantle theme to Claude Code</span>
          <select value={preset} onChange={e => setPreset(e.target.value)}>
            {PALETTES.map(x => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <span className="mini-swatch" style={{ background: `linear-gradient(90deg, ${p.bg} 0 30%, ${p.accent} 30% 60%, ${p.accent2} 60%)` }} />
        <ApplyThemeButton target={{ paletteId: p.id }} name={p.name} className="btn btn-primary" />
      </div>
    </section>
  )
}

function PluginList({ title, plugins }: { title: string; plugins: LocalPlugin[] }) {
  if (plugins.length === 0) return null
  return (
    <div className="subgroup">
      <h3>
        {title} <span className="count">{plugins.length}</span>
      </h3>
      <div className="rows">
        {plugins.map(p => (
          <div key={p.id} className="row-item">
            <div className="row-main">
              <b>{p.name}</b>
              {p.marketplace && <span className="muted small"> @{p.marketplace}</span>}
              {p.version && <span className="tag">v{p.version}</span>}
              {p.enabled === true && <span className="badge badge-on">Enabled</span>}
              {p.enabled === false && <span className="badge">Disabled</span>}
              {p.missing && <span className="badge badge-placeholder">Enabled, not installed</span>}
              {p.description && <div className="muted small clamp">{p.description}</div>}
              <div className="facets">
                {p.skills.length > 0 && <span>{p.skills.length} skills</span>}
                {p.commands.length > 0 && <span>{p.commands.length} commands</span>}
                {p.agents.length > 0 && <span>{p.agents.length} agents</span>}
                {p.connectors.length > 0 && <span>{p.connectors.length} connectors</span>}
                {p.hooks && <span>hooks</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillList({ skills }: { skills: LocalSkill[] }) {
  const personal = skills.filter(s => s.source === 'personal')
  const account = skills.filter(s => s.source === 'account')
  const byPlugin = useMemo(() => {
    const m = new Map<string, LocalSkill[]>()
    for (const s of skills.filter(x => x.source === 'plugin')) m.set(s.origin ?? '?', [...(m.get(s.origin ?? '?') ?? []), s])
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [skills])
  const row = (s: LocalSkill) => (
    <div key={`${s.source}-${s.origin}-${s.name}`} className="row-item">
      <div className="row-main">
        <b>{s.name}</b>
        {s.description && <div className="muted small clamp">{s.description}</div>}
        {s.path && <div className="muted small"><code>{s.path}</code></div>}
      </div>
    </div>
  )
  return (
    <>
      {personal.length > 0 && (
        <div className="subgroup">
          <h3>Personal <span className="count">{personal.length}</span></h3>
          <div className="rows">{personal.map(row)}</div>
        </div>
      )}
      {account.length > 0 && (
        <div className="subgroup">
          <h3>From your account <span className="count">{account.length}</span></h3>
          <div className="rows">{account.map(row)}</div>
        </div>
      )}
      {byPlugin.length > 0 && (
        <div className="subgroup">
          <h3>From plugins <span className="count">{byPlugin.reduce((n, [, l]) => n + l.length, 0)}</span></h3>
          {byPlugin.map(([origin, list]) => (
            <details key={origin} className="fold">
              <summary>
                <b>{origin}</b> <span className="count">{list.length}</span>
                <span className="muted small fold-preview">{list.slice(0, 4).map(s => s.name).join(', ')}{list.length > 4 ? '…' : ''}</span>
              </summary>
              <div className="chips">
                {list.map(s => (
                  <span key={s.name} className="tag">{s.name}</span>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
      {skills.length === 0 && <Empty>No skills found.</Empty>}
    </>
  )
}

const SCOPE_LABEL: Record<LocalConnector['scope'], string> = {
  user: 'User scope (~/.claude.json)',
  local: 'Project scope (per folder)',
  settings: 'From settings.json',
  plugin: 'Provided by plugins',
}

function ConnectorRow({ c }: { c: LocalConnector }) {
  return (
    <div className="row-item connector">
      <div className="row-main">
        <b>{c.name}</b> <span className="tag">{c.transport}</span>
        {c.disabled && <span className="badge">Disabled</span>}
        {c.hasOAuth && <span className="badge">OAuth</span>}
        {c.scope === 'local' && <span className="muted small"> · {c.origin}</span>}
        <div className="cmd">
          <code>{c.url ?? [c.command, ...c.args].filter(Boolean).join(' ')}</code>
        </div>
        {(c.env || c.headers) && (
          <div className="masked">
            <Lock size={12} className="lock" aria-hidden />
            {c.env && <span>env: {Object.keys(c.env).map(k => `${k}=••••••`).join(', ')}</span>}
            {c.headers && <span>headers: {Object.keys(c.headers).map(k => `${k}: ••••••`).join(', ')}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function ConnectorList({ connectors }: { connectors: LocalConnector[] }) {
  const direct = (['user', 'local', 'settings'] as const).map(s => [s, connectors.filter(c => c.scope === s)] as const).filter(([, l]) => l.length)
  const byPlugin = useMemo(() => {
    const m = new Map<string, LocalConnector[]>()
    for (const c of connectors.filter(x => x.scope === 'plugin')) m.set(c.origin, [...(m.get(c.origin) ?? []), c])
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [connectors])
  if (connectors.length === 0) return <Empty>No MCP servers configured.</Empty>
  return (
    <>
      {direct.map(([scope, list]) => (
        <div key={scope} className="subgroup">
          <h3>{SCOPE_LABEL[scope]} <span className="count">{list.length}</span></h3>
          <div className="rows">
            {list.map((c, i) => (
              <ConnectorRow key={`${c.origin}-${c.name}-${i}`} c={c} />
            ))}
          </div>
        </div>
      ))}
      {direct.length === 0 && <Empty>No MCP servers added directly; the ones below come with plugins.</Empty>}
      {byPlugin.length > 0 && (
        <div className="subgroup">
          <h3>{SCOPE_LABEL.plugin} <span className="count">{byPlugin.reduce((n, [, l]) => n + l.length, 0)}</span></h3>
          {byPlugin.map(([origin, list]) => (
            <details key={origin} className="fold">
              <summary>
                <b>{origin}</b> <span className="count">{list.length}</span>
                <span className="muted small fold-preview">{list.slice(0, 5).map(c => c.name).join(', ')}{list.length > 5 ? '…' : ''}</span>
              </summary>
              <div className="rows">
                {list.map((c, i) => (
                  <ConnectorRow key={`${c.name}-${i}`} c={c} />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  )
}
