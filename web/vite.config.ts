import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The companion (server/index.mjs) owns /api; Vite proxies to it so the
// browser only ever talks to one localhost origin.
const COMPANION_PORT = Number(process.env.MANTLE_COMPANION_PORT ?? 5178)

export default defineConfig({
  plugins: [react()],
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
