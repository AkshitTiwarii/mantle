// Redaction for anything that leaves the companion. MCP configs routinely
// carry API keys in env, headers, URLs and args; none of those values may reach
// the browser. Keys and shapes stay so people can still recognise a server.

export const MASK = '••••••'

const SECRET_NAME = /(token|secret|key|pass(word)?|auth|cred|cookie|session|bearer|private|signature|sig)/i
const SECRET_VALUE = [
  /^(sk|pk|rk)[-_][A-Za-z0-9_-]{8,}/, // sk-..., sk_live_...
  /^gh[pousr]_[A-Za-z0-9]{10,}/, // GitHub tokens
  /^github_pat_/,
  /^xox[abprs]-/, // Slack
  /^AKIA[0-9A-Z]{12,}/, // AWS
  /^AIza[0-9A-Za-z_-]{20,}/, // Google
  /^ya29\./,
  /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWT
  /^Bearer\s+/i,
  /^Basic\s+/i,
  /^[A-Fa-f0-9]{32,}$/, // long hex
  /^[A-Za-z0-9+/_-]{40,}={0,2}$/, // long base64-ish
]

export function looksSecret(value) {
  if (typeof value !== 'string') return false
  const v = value.trim()
  return SECRET_VALUE.some(re => re.test(v))
}

// Keep scheme, host, port and path; drop credentials and every query value.
export function redactUrl(raw) {
  if (typeof raw !== 'string') return undefined
  try {
    const u = new URL(raw)
    const hadAuth = Boolean(u.username || u.password)
    u.username = ''
    u.password = ''
    const keys = [...u.searchParams.keys()]
    u.search = ''
    let out = u.toString()
    if (keys.length) out += '?' + keys.map(k => `${encodeURIComponent(k)}=${MASK}`).join('&')
    if (u.hash) out = out.replace(u.hash, '')
    return hadAuth ? out.replace('://', `://${MASK}@`) : out
  } catch {
    return looksSecret(raw) ? MASK : raw.replace(/([?&][^=]+=)[^&]*/g, `$1${MASK}`)
  }
}

// Args like `--api-key abc`, `--token=abc`, `KEY=abc`, or a bare token.
export function redactArgs(args) {
  if (!Array.isArray(args)) return []
  const out = []
  let maskNext = false
  for (let i = 0; i < args.length; i++) {
    const s = String(args[i])
    if (maskNext) {
      out.push(MASK)
      maskNext = false
      continue
    }
    // Inline scripts (`node -e "..."`, `python -c "..."`) can embed anything.
    if (/^(-e|--eval|-c|--command|-p|--print)$/.test(s) && i + 1 < args.length) {
      out.push(s, `<inline script, ${String(args[++i]).length} chars>`)
      continue
    }
    if (s.length > 200) {
      out.push(`<${s.length} chars hidden>`)
      continue
    }
    const flag = s.match(/^(--?[A-Za-z0-9_-]+)(=(.*))?$/)
    if (flag && SECRET_NAME.test(flag[1])) {
      if (flag[2] !== undefined) out.push(`${flag[1]}=${MASK}`)
      else {
        out.push(s)
        maskNext = true
      }
      continue
    }
    const assign = s.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (assign) {
      out.push(`${assign[1]}=${MASK}`)
      continue
    }
    if (/^(https?|wss?):\/\//i.test(s)) {
      out.push(redactUrl(s))
      continue
    }
    // Header values passed as args, e.g. `--header "Authorization: Bearer x"`.
    const header = s.match(/^([A-Za-z0-9-]+):\s*(.+)$/)
    if (header && !/^[a-z]:[\\/]/i.test(s)) {
      out.push(`${header[1]}: ${MASK}`)
      continue
    }
    out.push(looksSecret(s) ? MASK : s)
  }
  return out
}

// Values are never sent, only key names.
function maskMap(obj) {
  if (!obj || typeof obj !== 'object') return undefined
  const keys = Object.keys(obj)
  return keys.length ? Object.fromEntries(keys.map(k => [k, MASK])) : undefined
}

// One MCP server entry, as found in ~/.claude.json, settings or a plugin's
// .mcp.json, reduced to what is safe and useful to display.
export function redactMcpServer(name, cfg = {}) {
  const transport = cfg.type ?? (cfg.url ? (String(cfg.url).includes('/sse') ? 'sse' : 'http') : 'stdio')
  return {
    name,
    transport,
    command: typeof cfg.command === 'string' ? cfg.command : undefined,
    args: redactArgs(cfg.args),
    url: redactUrl(cfg.url),
    env: maskMap(cfg.env),
    headers: maskMap(cfg.headers),
    hasOAuth: Boolean(cfg.oauth),
    disabled: cfg.disabled === true ? true : undefined,
  }
}
