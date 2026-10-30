import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// The companion (server/index.mjs) owns /api; Vite proxies to it so the
// browser only ever talks to one localhost origin.
const COMPANION_PORT = Number(process.env.MANTLE_COMPANION_PORT ?? 5178)

// Link previews (LinkedIn, X, Slack) and search engines need absolute URLs.
// SITE_URL overrides the public site, e.g. for a fork deployed elsewhere.
const SITE_URL = (process.env.SITE_URL ?? 'https://mantle.akshittiwari.me').replace(/\/+$/, '')
const VERSION = JSON.parse(readFileSync(fileURLToPath(new URL('../mantle/.claude-plugin/plugin.json', import.meta.url)), 'utf8')).version as string
const REPO = 'https://github.com/AkshitTiwarii/mantle'

// Every route as a real page, so clean URLs (/explore, /item/x) work on any
// static host without rewrites, each with its own title and description.
type Page = { path: string; title: string; description: string; index?: boolean }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function pages(): Page[] {
  const out: Page[] = [
    { path: 'explore', title: 'Explore 47,972 Claude skills, MCP connectors and plugins | Mantle', description: 'Search every agent skill on skills.sh, every server in the official MCP Registry and every official Claude Code plugin, with the exact install command for each.' },
    { path: 'make', title: 'Make a Claude Code theme from a wallpaper | Mantle', description: 'Build a theme for Claude Code, Windows Terminal and claude.ai from eight colors or any wallpaper, preview it live, and share it as a link.' },
    { path: 'me', title: 'My Claude: your installed skills, plugins and connectors | Mantle', description: 'A local dashboard of the skills, plugins, MCP connectors and themes you have installed. Runs on your own machine.', index: false },
  ]
  // Listings straight from the catalog source (no TS import in the config).
  const catalog = readFileSync(fileURLToPath(new URL('./src/lib/catalog.real.ts', import.meta.url)), 'utf8')
  const TYPE: Record<string, string> = { skill: 'agent skill', connector: 'MCP connector', plugin: 'Claude Code plugin' }
  for (const m of catalog.matchAll(/id: '([^']+)',\s*type: '(\w+)',\s*name: (['"])(.*?)\3,\s*tagline:\s*(['"])(.*?)\5/g)) {
    out.push({ path: `item/${m[1]}`, title: `${m[4]}: ${TYPE[m[2]] ?? m[2]} for Claude | Mantle`, description: `${m[6]} How to install and use ${m[4]} with Claude Code.` })
  }
  const palettes = readFileSync(fileURLToPath(new URL('./src/lib/palettes.js', import.meta.url)), 'utf8')
  for (const m of palettes.matchAll(/id: '([\w-]+)', name: '([^']+)', mode: '(\w+)'/g)) {
    out.push({ path: `item/theme-${m[1]}`, title: `${m[2]}: a ${m[3]} theme for Claude Code, Windows Terminal and claude.ai | Mantle`, description: `${m[2]} for Claude Code, Windows Terminal and claude.ai, with colors that react as Claude thinks, runs tools and finishes. Install with /mantle ${m[1]}.` })
  }
  out.push({ path: 'item/plugin-mantle', title: 'Mantle: the Claude Code plugin | Mantle', description: 'One theme for Claude Code, Windows Terminal and claude.ai, alive to Claude, plus Atlas and Doctor.' })
  return out
}

function pageHtml(html: string, p: Page): string {
  const url = `${SITE_URL}/${p.path}`
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(p.description)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(p.title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(p.description)}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(p.title)}`)
    .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(p.description)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
    .replace(/(<meta name="robots" content=")[^"]*/, `$1${p.index === false ? 'noindex, follow' : 'index, follow, max-image-preview:large'}`)
}

// robots.txt, sitemap.xml, llms.txt and the per-route pages, written into the build.
function discovery(): Plugin {
  let outDir = 'dist'
  return {
    name: 'mantle-discovery',
    configResolved(c) {
      outDir = c.build.outDir
    },
    transformIndexHtml: html =>
      html
        .replaceAll('content="/og.png"', `content="${SITE_URL}/og.png"`)
        .replaceAll('%SITE_URL%og.png', `${SITE_URL}/og.png`)
        .replaceAll('%SITE_URL%', `${SITE_URL}/`)
        .replaceAll('%VERSION%', VERSION),
    writeBundle() {
      const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), outDir)
      const html = readFileSync(path.join(root, 'index.html'), 'utf8')
      const list = pages()
      for (const p of list) {
        mkdirSync(path.join(root, p.path), { recursive: true })
        writeFileSync(path.join(root, p.path, 'index.html'), pageHtml(html, p))
      }
      // Unknown paths still load the app, which shows its own not-found view.
      writeFileSync(path.join(root, '404.html'), html.replace(/(<meta name="robots" content=")[^"]*/, '$1noindex'))
      const today = new Date().toISOString().slice(0, 10)
      const urls = ['', ...list.filter(p => p.index !== false).map(p => p.path)]
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE_URL}/${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`
      writeFileSync(path.join(root, 'sitemap.xml'), sitemap)
      writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`)
    },
    generateBundle() {
      const site = SITE_URL
      const llms = [
        '# Mantle',
        '',
        '> A free, open-source (MIT) Claude Code plugin: themes and 4K wallpapers for Claude Code, Windows Terminal, iTerm2 and claude.ai; Mantle Atlas, a knowledge base of 30,000+ agent skills, 17,000+ MCP connectors and 440 plugins; and Mantle Doctor, a check-up for a Claude Code setup.',
        '',
        `Version ${VERSION}. Install in Claude Code: \`/plugin install mantle --marketplace AkshitTiwarii/mantle\`. Skills only, in any agent: \`npx skills add AkshitTiwarii/mantle\`.`,
        '',
        '## Docs',
        `- [README](${REPO}#readme): everything Mantle does, commands and where it works`,
        `- [Changelog](${REPO}/blob/main/CHANGELOG.md)`,
        `- [Mantle Atlas skill](${REPO}/blob/main/mantle/skills/mantle-atlas/SKILL.md): find the right skill, MCP connector or plugin; stack recommendations; trust check`,
        `- [Mantle Doctor skill](${REPO}/blob/main/mantle/skills/mantle-doctor/SKILL.md): context cost, CLAUDE.md lint, MCP and permission checks`,
        '',
        '## Website',
        `- [Gallery](${site}): themes, wallpapers, skills, connectors and plugins with install commands`,
        `- [Explore](${SITE_URL}/explore): search all 47,000+ skills, connectors and plugins`,
        `- [Make a theme](${SITE_URL}/make): build a theme from colors or a wallpaper`,
        '',
      ].join('\n')
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llms })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), discovery()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: `http://127.0.0.1:${COMPANION_PORT}`, changeOrigin: false },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    proxy: {
      '/api': { target: `http://127.0.0.1:${COMPANION_PORT}`, changeOrigin: false },
    },
  },
})
