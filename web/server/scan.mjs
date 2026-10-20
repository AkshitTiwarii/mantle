// Read-only scan of the local Claude setup. Everything returned here is shown
// in the browser, so it is limited to names, descriptions, versions and
// redacted connector shapes; credentials files are never opened.
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { redactMcpServer } from './redact.mjs'

const HOME = os.homedir()

export function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude')
}

// ~/.claude.json, or <CLAUDE_CONFIG_DIR>/.claude.json when that is set.
function userConfigPath() {
  return process.env.CLAUDE_CONFIG_DIR ? path.join(process.env.CLAUDE_CONFIG_DIR, '.claude.json') : path.join(HOME, '.claude.json')
}

export function tilde(p) {
  if (!p) return p
  const norm = p.replace(/\\/g, '/')
  const home = HOME.replace(/\\/g, '/')
  return norm.toLowerCase().startsWith(home.toLowerCase()) ? '~' + norm.slice(home.length) : norm
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return undefined
  }
}

async function readText(file, max = 64 * 1024) {
  try {
    const handle = await fs.open(file, 'r')
    try {
      const buf = Buffer.alloc(max)
      const { bytesRead } = await handle.read(buf, 0, max, 0)
      return buf.subarray(0, bytesRead).toString('utf8')
    } finally {
      await handle.close()
    }
  } catch {
    return undefined
  }
}

async function dirs(dir) {
  try {
    return (await fs.readdir(dir, { withFileTypes: true })).filter(d => d.isDirectory() && !d.name.startsWith('.')).map(d => d.name)
  } catch {
    return []
  }
}

async function files(dir, ext) {
  try {
    return (await fs.readdir(dir, { withFileTypes: true })).filter(d => d.isFile() && d.name.endsWith(ext)).map(d => d.name)
  } catch {
    return []
  }
}

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

// Minimal YAML front matter reader for SKILL.md: `name:` and `description:`,
// including folded (`>`/`|`) descriptions.
export function frontMatter(text) {
  const m = text?.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  const lines = m[1].split(/\r?\n/)
  const out = {}
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/)
    if (!kv) continue
    let value = kv[2].trim()
    if (value === '>' || value === '|' || value === '>-' || value === '|-') {
      const block = []
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) block.push(lines[++i].trim())
      value = block.join(' ')
    }
    out[kv[1]] = value.replace(/^["']|["']$/g, '')
  }
  return out
}

function clip(s, n = 280) {
  if (typeof s !== 'string') return undefined
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s
}

async function skillsIn(dir) {
  const out = []
  for (const name of await dirs(dir)) {
    const fm = frontMatter(await readText(path.join(dir, name, 'SKILL.md')))
    if (fm.name || (await exists(path.join(dir, name, 'SKILL.md')))) {
      out.push({ name: fm.name || name, description: clip(fm.description), path: tilde(path.join(dir, name)) })
    }
  }
  return out
}

async function pluginShape(root) {
  const manifest = (await readJson(path.join(root, '.claude-plugin', 'plugin.json'))) ?? (await readJson(path.join(root, 'plugin.json'))) ?? {}
  const skills = (await skillsIn(path.join(root, 'skills'))).map(s => s.name)
  const commands = (await files(path.join(root, 'commands'), '.md')).map(f => f.replace(/\.md$/, ''))
  const agents = (await files(path.join(root, 'agents'), '.md')).map(f => f.replace(/\.md$/, ''))
  const mcp = await readJson(path.join(root, '.mcp.json'))
  const mcpServers = mcp ? Object.entries(mcp.mcpServers ?? mcp).filter(([, v]) => v && typeof v === 'object') : []
  const hasHooks = Boolean(manifest.hooks) || (await exists(path.join(root, 'hooks')))
  return { manifest, skills, commands, agents, mcpServers, hasHooks }
}

function connectorsFrom(map, scope, origin) {
  if (!map || typeof map !== 'object') return []
  return Object.entries(map)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([name, cfg]) => ({ ...redactMcpServer(name, cfg), scope, origin }))
}

export async function scanLocal() {
  const base = claudeDir()
  const warnings = []
  const settingsFiles = ['settings.json', 'settings.local.json']
  const settings = {}
  for (const f of settingsFiles) {
    const j = await readJson(path.join(base, f))
    if (j) Object.assign(settings, j, { enabledPlugins: { ...settings.enabledPlugins, ...j.enabledPlugins } })
  }
  const enabled = settings.enabledPlugins ?? {}

  // ---- marketplaces ----
  const known = (await readJson(path.join(base, 'plugins', 'known_marketplaces.json'))) ?? {}
  const declared = settings.extraKnownMarketplaces ?? {}
  const marketplaces = [...new Set([...Object.keys(known), ...Object.keys(declared)])].map(name => {
    const src = known[name]?.source ?? declared[name]?.source ?? {}
    return {
      name,
      source: src.source,
      repo: src.repo ?? src.url ?? src.path,
      lastUpdated: known[name]?.lastUpdated,
      inSettings: Boolean(declared[name]),
      cloned: Boolean(known[name]),
    }
  })

  // ---- plugins (installed from marketplaces) ----
  const plugins = []
  const connectors = []
  const skills = []
  const installed = (await readJson(path.join(base, 'plugins', 'installed_plugins.json')))?.plugins ?? {}
  for (const [id, entries] of Object.entries(installed)) {
    const entry = Array.isArray(entries) ? entries[0] : entries
    const [name, marketplace] = id.split('@')
    const shape = entry?.installPath ? await pluginShape(entry.installPath) : { manifest: {}, skills: [], commands: [], agents: [], mcpServers: [], hasHooks: false }
    plugins.push({
      id,
      name,
      marketplace,
      version: entry?.version ?? shape.manifest.version,
      description: clip(shape.manifest.description),
      enabled: id in enabled ? Boolean(enabled[id]) : undefined,
      origin: 'marketplace',
      scope: entry?.scope,
      installedAt: entry?.installedAt,
      skills: shape.skills,
      commands: shape.commands,
      agents: shape.agents,
      hooks: shape.hasHooks,
      connectors: shape.mcpServers.map(([n]) => n),
    })
    connectors.push(...connectorsFrom(Object.fromEntries(shape.mcpServers), 'plugin', id))
    skills.push(...shape.skills.map(s => ({ name: s, source: 'plugin', origin: id })))
  }
  // Enabled in settings but not (yet) installed.
  for (const [id, on] of Object.entries(enabled)) {
    if (!installed[id] && on) {
      const [name, marketplace] = id.split('@')
      plugins.push({ id, name, marketplace, enabled: true, origin: 'marketplace', missing: true, skills: [], commands: [], agents: [], connectors: [] })
    }
  }

  // ---- plugins synced from the account ----
  const seen = new Set(plugins.map(p => p.name))
  for (const bucket of await dirs(path.join(base, 'plugins', 'synced'))) {
    const bucketDir = path.join(base, 'plugins', 'synced', bucket)
    // `<dir>.meta.json` names the marketplace; a `name~g2` copy may hold the
    // only meta file for `name`.
    const metas = {}
    for (const f of await files(bucketDir, '.meta.json')) {
      const dir = f.replace(/\.meta\.json$/, '')
      const meta = await readJson(path.join(bucketDir, f))
      if (meta) metas[dir] = metas[dir.replace(/~g\d+$/, '')] ??= meta
    }
    for (const dir of await dirs(bucketDir)) {
      const root = path.join(bucketDir, dir)
      const shape = await pluginShape(root)
      const name = shape.manifest.name ?? dir.replace(/~g\d+$/, '')
      if (seen.has(name)) continue
      seen.add(name)
      const meta = metas[dir] ?? metas[dir.replace(/~g\d+$/, '')] ?? {}
      const id = meta.marketplace_name ? `${name}@${meta.marketplace_name}` : name
      plugins.push({
        id,
        name,
        marketplace: meta.marketplace_name,
        version: shape.manifest.version,
        description: clip(shape.manifest.description),
        enabled: id in enabled ? Boolean(enabled[id]) : undefined,
        origin: 'account',
        skills: shape.skills,
        commands: shape.commands,
        agents: shape.agents,
        hooks: shape.hasHooks,
        connectors: shape.mcpServers.map(([n]) => n),
      })
      connectors.push(...connectorsFrom(Object.fromEntries(shape.mcpServers), 'plugin', id))
      skills.push(...shape.skills.map(s => ({ name: s, source: 'plugin', origin: id })))
    }
  }

  // ---- skills: personal and account-synced ----
  for (const s of await skillsIn(path.join(base, 'skills'))) {
    if (s.name !== 'synced') skills.push({ ...s, source: 'personal' })
  }
  const syncedSkillNames = new Set()
  for (const bucket of await dirs(path.join(base, 'skills', 'synced'))) {
    const manifest = await readJson(path.join(base, 'skills', 'synced', bucket, 'manifest.json'))
    for (const s of manifest?.skills ?? []) {
      if (syncedSkillNames.has(s.name)) continue
      syncedSkillNames.add(s.name)
      skills.push({ name: s.name, description: clip(s.description), source: 'account', origin: s.source })
    }
  }

  // ---- connectors: user / project / settings scopes ----
  const userConfig = await readJson(userConfigPath())
  if (userConfig) {
    connectors.push(...connectorsFrom(userConfig.mcpServers, 'user', tilde(userConfigPath())))
    for (const [project, cfg] of Object.entries(userConfig.projects ?? {})) {
      connectors.push(...connectorsFrom(cfg?.mcpServers, 'local', tilde(project)))
    }
  } else {
    warnings.push(`${tilde(userConfigPath())} not found or unreadable.`)
  }
  connectors.push(...connectorsFrom(settings.mcpServers, 'settings', tilde(path.join(base, 'settings.json'))))
  const legacy = path.join(base, '.claude.json')
  if (legacy !== userConfigPath()) connectors.push(...connectorsFrom((await readJson(legacy))?.mcpServers, 'user', tilde(legacy)))

  // ---- themes ----
  const themesDir = path.join(base, 'themes')
  const activeTheme = typeof settings.theme === 'string' ? settings.theme : undefined
  const themes = []
  for (const f of await files(themesDir, '.json')) {
    const j = await readJson(path.join(themesDir, f))
    const slug = f.replace(/\.json$/, '')
    const o = j?.overrides ?? {}
    themes.push({
      slug,
      file: tilde(path.join(themesDir, f)),
      name: typeof j?.name === 'string' ? j.name : slug,
      base: j?.base,
      valid: Boolean(j && typeof j === 'object'),
      active: activeTheme === `custom:${slug}`,
      isMantle: slug === 'mantle',
      swatch: ['claude', 'suggestion', 'permission', 'success', 'warning', 'error', 'text', 'userMessageBackground', 'subtle']
        .map(k => o[k])
        .filter(v => typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v)),
      tokenCount: Object.keys(o).length,
    })
  }

  // ---- Mantle (the mod's outputs and, if found, its stored config) ----
  const mantle = await scanMantle(base, activeTheme)

  return {
    generatedAt: new Date().toISOString(),
    claudeDir: tilde(base),
    activeTheme,
    model: typeof settings.model === 'string' ? settings.model : undefined,
    plugins,
    skills,
    connectors,
    themes,
    marketplaces,
    mantle,
    warnings,
  }
}

async function scanMantle(base, activeTheme) {
  const themeFile = path.join(base, 'themes', 'mantle.json')
  const theme = await readJson(themeFile)
  const payloadFile = path.join(base, 'mantle', 'chrome-extension', 'mantle-theme.json')
  const payload = await readJson(payloadFile)
  const fragmentFile = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Windows Terminal', 'Fragments', 'Mantle', 'mantle.json')
    : undefined
  const fragment = fragmentFile ? await readJson(fragmentFile) : undefined
  const profile = fragment?.profiles?.[0]

  // The mod keeps its studio config in its plugin store; look for it where
  // Claude Code keeps plugin data, without assuming an exact file name.
  let studio
  for (const dir of await dirs(path.join(base, 'plugins', 'data'))) {
    if (!/mantle/i.test(dir)) continue
    for (const f of await files(path.join(base, 'plugins', 'data', dir), '.json')) {
      const j = await readJson(path.join(base, 'plugins', 'data', dir, f))
      const cfg = j?.config ?? (j?.preset && j?.targets ? j : undefined)
      if (cfg) {
        studio = {
          file: tilde(path.join(base, 'plugins', 'data', dir, f)),
          preset: cfg.preset,
          reactive: cfg.reactive,
          targets: cfg.targets,
          codePreset: cfg.code?.preset || undefined,
          terminalPreset: cfg.terminal?.preset || undefined,
          webPreset: cfg.web?.preset || undefined,
        }
      }
    }
  }

  return {
    studio,
    code: theme
      ? { file: tilde(themeFile), name: theme.name, base: theme.base, selected: activeTheme === 'custom:mantle', accent: theme.overrides?.claude }
      : { file: tilde(themeFile), missing: true, selected: activeTheme === 'custom:mantle' },
    web: payload
      ? {
          file: tilde(payloadFile),
          palette: payload.palette?.name,
          // Wallpapers are often multi-megabyte data URIs; say whether one is set.
          wallpaper: payload.wallpaper ? (String(payload.wallpaper).startsWith('data:') ? 'local image' : 'URL') : undefined,
          reactive: payload.reactive,
          updatedAt: payload.updatedAt,
        }
      : { file: tilde(payloadFile), missing: true },
    terminal: fragment
      ? { file: tilde(fragmentFile), profile: profile?.name, scheme: profile?.colorScheme, acrylic: profile?.useAcrylic, wallpaper: Boolean(profile?.backgroundImage) }
      : { file: fragmentFile ? tilde(fragmentFile) : undefined, missing: true },
  }
}
