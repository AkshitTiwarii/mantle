import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// The companion (server/index.mjs) owns /api; Vite proxies to it so the
// browser only ever talks to one localhost origin.
const COMPANION_PORT = Number(process.env.MANTLE_COMPANION_PORT ?? 5178)

// Link previews (LinkedIn, X, Slack) need absolute image URLs. On Vercel the
// production domain comes from its system env; SITE_URL overrides it.
const SITE_URL = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    { name: 'absolute-og-urls', transformIndexHtml: html => html.replaceAll('content="/og.png"', `content="${SITE_URL}/og.png"`).replace('%SITE_URL%', SITE_URL || '/') },
  ],
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
