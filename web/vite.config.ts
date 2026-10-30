import { readFileSync } from 'node:fs'
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

// robots.txt, sitemap.xml and llms.txt, written into the build. The sitemap
// needs absolute URLs, so it is only emitted when SITE_URL is set.
function discovery(): Plugin {
  return {
    name: 'mantle-discovery',
    transformIndexHtml: html =>
      html
        .replaceAll('content="/og.png"', `content="${SITE_URL}/og.png"`)
        .replaceAll('%SITE_URL%og.png', `${SITE_URL}/og.png`)
        .replaceAll('%SITE_URL%', `${SITE_URL}/`)
        .replaceAll('%VERSION%', VERSION),
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /', ...(SITE_URL ? [`Sitemap: ${SITE_URL}/sitemap.xml`] : [])].join('\n') + '\n'
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      if (SITE_URL) {
        const today = new Date().toISOString().slice(0, 10)
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      }
      const site = SITE_URL || REPO
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
        ...(SITE_URL ? [`- [Explore](${SITE_URL}/#/explore): search all 47,000+ skills, connectors and plugins`, `- [Make a theme](${SITE_URL}/#/make): build a theme from colors or a wallpaper`] : []),
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
