// Mantle companion: a tiny local server that lets the web app see this
// machine's Claude setup. Bound to 127.0.0.1, no outbound network calls, no
// dependencies. Read-only except for one action: writing the Mantle theme to
// ~/.claude/themes/mantle.json, which the UI confirms first.
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PALETTES, claudeCodeTheme, isHex } from '../src/lib/palettes.js'
import { claudeDir, scanLocal, tilde } from './scan.mjs'

const PORT = Number(process.env.MANTLE_COMPANION_PORT ?? 5178)
const HOST = '127.0.0.1'
const VERSION = '0.1.0'
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])
const MAX_BODY = 64 * 1024
// The same name the Mantle mod gives its live theme, so both write one file.
const THEME_NAME = 'Mantle (live)'

const themePath = () => path.join(claudeDir(), 'themes', 'mantle.json')
// Previous mantle.json content, kept in memory only, for a one-step undo.
let previous

// Reject anything not addressed to a loopback name (DNS rebinding) and any
// cross-site caller. Browsers send Origin on cross-origin GETs and every POST.
function guard(req, isWrite) {
  const host = (req.headers.host ?? '').toLowerCase().replace(/:\d+$/, '')
  if (!LOCAL_HOSTS.has(host)) return 'host not allowed'
  const origin = req.headers.origin
  if (origin) {
    try {
      const u = new URL(origin)
      if (!LOCAL_HOSTS.has(u.hostname.toLowerCase())) return 'origin not allowed'
    } catch {
      return 'bad origin'
    }
  } else if (isWrite) {
    return 'origin required'
  }
  if (isWrite && !String(req.headers['content-type'] ?? '').startsWith('application/json')) return 'json required'
  return undefined
}

function send(res, status, body) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(json)
}

async function readBody(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw new Error('body too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

const PALETTE_COLORS = ['bg', 'surface', 'surfaceAlt', 'text', 'muted', 'border', 'accent', 'accent2', 'success', 'error', 'warning', 'info']

// A palette from the theme maker: every color must be a hex value.
function validPalette(p) {
  if (!p || typeof p !== 'object') return 'palette missing'
  if (p.mode !== 'dark' && p.mode !== 'light') return 'mode must be dark or light'
  for (const k of PALETTE_COLORS) if (!isHex(p[k])) return `${k} must be a hex color`
  if (!Array.isArray(p.ansi) || p.ansi.length !== 16 || !p.ansi.every(isHex)) return 'ansi must be 16 hex colors'
  const name = typeof p.name === 'string' ? p.name.trim().slice(0, 40) : ''
  return { ...Object.fromEntries(PALETTE_COLORS.map(k => [k, p[k]])), id: 'custom', name: name || 'Custom', mode: p.mode, ansi: p.ansi }
}

async function currentTheme() {
  try {
    const text = await fs.readFile(themePath(), 'utf8')
    let name
    try {
      name = JSON.parse(text).name
    } catch {}
    return { exists: true, text, name }
  } catch {
    return { exists: false }
  }
}

async function writeTheme(text) {
  await fs.mkdir(path.dirname(themePath()), { recursive: true })
  await fs.writeFile(themePath(), text, 'utf8')
}

const routes = {
  'GET /api/health': async () => [200, { ok: true, version: VERSION, claudeDir: tilde(claudeDir()), presets: PALETTES.map(p => p.id) }],

  'GET /api/local': async () => [200, await scanLocal()],

  'GET /api/mantle-theme': async () => {
    const cur = await currentTheme()
    return [200, { file: tilde(themePath()), exists: cur.exists, name: cur.name, canUndo: previous !== undefined }]
  },

  'POST /api/apply-theme': async body => {
    if (body.confirm !== true) return [400, { error: 'confirmation required' }]
    let palette
    if (typeof body.paletteId === 'string') {
      palette = PALETTES.find(p => p.id === body.paletteId)
      if (!palette) return [400, { error: `unknown preset "${body.paletteId}"` }]
    } else {
      const checked = validPalette(body.palette)
      if (typeof checked === 'string') return [400, { error: checked }]
      palette = checked
    }
    const cur = await currentTheme()
    previous = cur.exists ? cur.text : undefined
    const theme = claudeCodeTheme(palette, { name: THEME_NAME })
    await writeTheme(JSON.stringify(theme, null, 2) + '\n')
    console.log(`wrote ${tilde(themePath())} (${palette.name})`)
    return [200, { ok: true, file: tilde(themePath()), palette: palette.name, replaced: cur.exists ? cur.name ?? 'unnamed theme' : null, canUndo: previous !== undefined }]
  },

  'POST /api/undo-theme': async body => {
    if (body.confirm !== true) return [400, { error: 'confirmation required' }]
    if (previous === undefined) return [409, { error: 'nothing to undo' }]
    await writeTheme(previous)
    previous = undefined
    console.log(`restored previous ${tilde(themePath())}`)
    return [200, { ok: true, file: tilde(themePath()) }]
  },
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  const key = `${req.method} ${url.pathname}`
  const route = routes[key]
  if (!route) return send(res, 404, { error: 'not found' })
  const isWrite = req.method !== 'GET'
  const denied = guard(req, isWrite)
  if (denied) return send(res, 403, { error: denied })
  try {
    const body = isWrite ? await readBody(req) : undefined
    const [status, payload] = await route(body ?? {})
    send(res, status, payload)
  } catch (err) {
    send(res, 500, { error: err instanceof Error ? err.message : 'failed' })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Mantle companion on http://${HOST}:${PORT} (reading ${tilde(claudeDir())}, read-only except themes/mantle.json)`)
})
server.on('error', err => {
  console.error(err.code === 'EADDRINUSE' ? `port ${PORT} is in use; set MANTLE_COMPANION_PORT` : err.message)
  process.exit(1)
})
