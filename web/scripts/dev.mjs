// `npm run dev`: start the local companion and the Vite dev server together,
// prefix their output, and stop both when either exits or on Ctrl+C.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')

const procs = [
  { name: 'companion', color: 36, args: [path.join(root, 'server', 'index.mjs')] },
  { name: 'web', color: 35, args: [viteBin] },
].map(({ name, color, args }) => {
  const child = spawn(process.execPath, args, { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  const tag = `\x1b[${color}m[${name}]\x1b[0m `
  const pipe = stream => stream.on('data', chunk => {
    for (const line of String(chunk).split(/\r?\n/)) if (line.trim()) process.stdout.write(tag + line + '\n')
  })
  pipe(child.stdout)
  pipe(child.stderr)
  child.on('exit', code => {
    process.stdout.write(`${tag}exited (${code ?? 'signal'})\n`)
    shutdown(code ?? 0)
  })
  return child
})

let stopping = false
function shutdown(code) {
  if (stopping) return
  stopping = true
  for (const child of procs) if (child.exitCode === null) child.kill()
  setTimeout(() => process.exit(code), 200)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
