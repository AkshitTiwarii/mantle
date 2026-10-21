import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import { DEFAULT_CONFIG, SHORTCUT, itermProfile, terminalFragment } from '../hooks/register.tsx'

const PANE = {
  plugin: 'mantle',
  component: 'Pane',
  requestId: 'mantle-studio',
  props: {
    title: 'Mantle theme studio',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

type Write = { path: string; text: string }

// The turn events, typed loosely: their full input types are too deep to infer here.
type Turns = { start(e: object): Promise<unknown>; complete(e: object): Promise<unknown> }
const turnOf = ($: { turn: unknown }) => $.turn as Turns

function world(on: On, applied: boolean) {
  const writes: Write[] = []
  const clock = mock.clock(on)
  mock.store(on, applied ? { applied: true } : {})
  mock.env(on, { USERPROFILE: 'C:/Users/me', LOCALAPPDATA: 'C:/Users/me/AppData/Local' })
  on('command.register', () => ({ value: { command: 'mantle' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('fs.write', (_, e) => {
    writes.push({ path: e.path.replaceAll('\\', '/'), text: e.text })
    return { value: undefined }
  })
  on('fs.exists', () => ({ value: false }))
  on('fs.read', () => ({ value: '{}' }))
  on('config.list', () => ({ value: [] }))
  on('config.set', (_, e) => ({ value: e.value }))
  on('tool.call', () => ({ result: {} }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  const themeWrites = () => writes.filter(w => w.path.endsWith('/themes/mantle.json')).map(w => JSON.parse(w.text))

  return { writes, clock, themeWrites }
}

test('nothing is written before the person applies a theme', async ($, on) => {
  const { clock, writes } = world(on, false)
  const turn = turnOf($)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await turn.start({ text: 'hi', turnId: 't1' })
  await ($.tool as unknown as { call(e: object): Promise<unknown> }).call({ tool: 'Bash', command: 'ls' })
  await clock.advance(500)

  expect(writes.length).toBe(0)
})

test('the live theme follows thinking, tools and the end of a turn', async ($, on) => {
  const { clock, themeWrites } = world(on, true)
  const turn = turnOf($)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const idle = themeWrites().at(-1)
  expect(idle?.overrides.claude).toBe('#5eead4')

  await turn.start({ text: 'hi', turnId: 't1' })
  await clock.advance(100)
  expect(themeWrites().at(-1)?.overrides.claude).toBe('#a78bfa')

  await turn.complete({ answer: 'ok', durationMs: 10, isAborted: false, turnId: 't1', reason: 'answer' })
  await clock.advance(100)
  expect(themeWrites().at(-1)?.overrides.claude).toBe('#4ade80')

  await clock.advance(3000)
  expect(themeWrites().at(-1)?.overrides.claude).toBe('#5eead4')
})

test('/mantle apply writes the theme, the terminal fragment and the browser payload', async ($, on) => {
  const { writes } = world(on, false)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const out = await $.command.run({ command: 'mantle', args: 'synthwave' } as never)

  const paths = writes.map(w => w.path)
  expect(paths.some(p => p.endsWith('/themes/mantle.json'))).toBe(true)
  expect(paths.some(p => p.endsWith('Fragments/Mantle/mantle.json'))).toBe(true)
  expect(paths.some(p => p.endsWith('/mantle/chrome-extension/mantle-theme.json'))).toBe(true)
  const fragment = JSON.parse(writes.find(w => w.path.endsWith('Fragments/Mantle/mantle.json'))!.text)
  expect(fragment.profiles[0].colorScheme).toBe('Mantle Synthwave')
  expect(JSON.stringify(out)).toContain('Synthwave')
})

test('the studio draws on terminal and desktop', async ($, on) => {
  world(on, false)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /Mantle/ }))?.text).toContain('Mantle')
    await ui.press({ key: 'tab-terminal' })
    expect(await ui.find({ key: 'term-wallpaper' })).toBeDefined()
    await ui.press({ key: 'tab-web' })
    expect(await ui.find({ key: 'web-blur' })).toBeDefined()
    await ui.unmount()
  }
})

test('the wallpaper sits beside the fragment and reaches the profiles you use', async () => {
  const c = {
    ...DEFAULT_CONFIG,
    terminal: { ...DEFAULT_CONFIG.terminal, wallpaper: 'C:\\Users\\me\\.claude\\mantle\\wallpapers\\Carina Nebula.jpg', profiles: ['{61c54bbd-c2c6-5271-96e7-009a87ff44bf}'], everywhere: true },
  }
  const f = terminalFragment(c)
  // Windows Terminal 1.24+ only loads images from the fragment's folder.
  expect(f.profiles[0].backgroundImage).toBe('wall-Carina-Nebula.jpg')
  expect(f.profiles[1]).toMatchObject({ updates: '{61c54bbd-c2c6-5271-96e7-009a87ff44bf}', backgroundImage: 'wall-Carina-Nebula.jpg', colorScheme: 'Mantle Aurora' })
})

test('only the Claude profile gets the wallpaper unless everywhere is on', async () => {
  const guid = '{61c54bbd-c2c6-5271-96e7-009a87ff44bf}'
  const base = { ...DEFAULT_CONFIG, terminal: { ...DEFAULT_CONFIG.terminal, wallpaper: 'C:\w\a.jpg', profiles: [guid] } }
  expect(terminalFragment(base).profiles).toHaveLength(1)
  const everywhere = { ...base, terminal: { ...base.terminal, everywhere: true } }
  expect(terminalFragment(everywhere).profiles[1]).toMatchObject({ updates: guid })
})

test('macOS gets an iTerm2 dynamic profile with the wallpaper and the palette', async () => {
  const c = { ...DEFAULT_CONFIG, terminal: { ...DEFAULT_CONFIG.terminal, wallpaper: '/Users/me/.claude/mantle/wallpapers/a.jpg' } }
  const p = itermProfile(c).Profiles[0] as Record<string, unknown>
  expect(p.Name).toBe('Claude · Mantle')
  expect(p['Background Image Location']).toBe('/Users/me/.claude/mantle/wallpapers/a.jpg')
  expect(p.Blend).toBe(0.7)
  expect(p['Ansi 15 Color']).toBeDefined()
})

test('the claude shortcut is plain ASCII and opens the Mantle profile', async () => {
  expect(/^[\x00-\x7f]*$/.test(SHORTCUT)).toBe(true)
  expect(SHORTCUT).toContain("wt.exe -w 0 nt -p '{d1f4b7a2-3c6e-4f81-9a2b-5e7c0d9f4a11}'")
  expect(SHORTCUT).toContain(String.raw`$dir = (Get-Location).ProviderPath.TrimEnd('\') + '\.'`)
})
