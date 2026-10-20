import { PALETTES } from './palettes.js'
import type { Palette } from './palettes.js'
import { REAL_ITEMS } from './catalog.real'

export type ItemType = 'theme' | 'skill' | 'connector' | 'plugin'

// `mantle`: ships with Mantle. `verified`: a real public project whose repo and
// install command were checked when this entry was written. `placeholder`:
// sample content, not installable.
export type ItemStatus = 'mantle' | 'verified' | 'placeholder'

// Where a step runs: inside Claude Code's prompt, or in a system terminal.
export type InstallStep = { label: string; command: string; where: 'claude-code' | 'terminal' }

export type Item = {
  id: string
  type: ItemType
  name: string
  tagline: string
  description: string
  author: string
  source?: { label: string; url: string }
  license?: string
  tags: string[]
  status: ItemStatus
  install: InstallStep[]
  palette?: Palette
  includes?: string[]
}

export const TYPE_LABEL: Record<ItemType, string> = {
  theme: 'Theme',
  skill: 'Skill',
  connector: 'Connector',
  plugin: 'Plugin',
}

export const TYPE_PLURAL: Record<ItemType, string> = {
  theme: 'Themes',
  skill: 'Skills',
  connector: 'Connectors',
  plugin: 'Plugins',
}

const THEME_COPY: Record<string, { tagline: string; tags: string[] }> = {
  ember: { tagline: 'Warm charcoal and terracotta, like a fire left to glow.', tags: ['warm', 'cozy'] },
  aurora: { tagline: 'Midnight navy lit by teal and violet light.', tags: ['cool', 'vivid'] },
  synthwave: { tagline: 'Neon magenta and cyan over deep purple.', tags: ['neon', 'retro', 'vivid'] },
  tokyo: { tagline: 'Soft indigo with city-light blues and lilacs.', tags: ['cool', 'calm'] },
  mocha: { tagline: 'Pastel mauve and pink on a dark, creamy base.', tags: ['pastel', 'calm'] },
  rosepine: { tagline: 'Muted rose and iris on a low-light base.', tags: ['muted', 'calm'] },
  nord: { tagline: 'Arctic slate with frost blues and aurora purples.', tags: ['cool', 'muted'] },
  forest: { tagline: 'Moss, fern and lantern gold on deep green.', tags: ['natural', 'warm'] },
  ocean: { tagline: 'Deep-water blues with bright sky and lagoon accents.', tags: ['cool', 'vivid'] },
  paper: { tagline: 'Warm off-white with ink and rust accents.', tags: ['warm', 'readable'] },
}

const themes: Item[] = PALETTES.map(p => ({
  id: `theme-${p.id}`,
  type: 'theme',
  name: p.name,
  tagline: THEME_COPY[p.id]?.tagline ?? '',
  description:
    'One palette for every surface: the Claude Code terminal UI, a Windows Terminal color scheme, and the claude.ai web app. ' +
    'With the Mantle mod, the accent shifts as Claude thinks, runs tools, plans, finishes or hits an error.',
  author: 'Mantle',
  tags: [p.mode, ...(THEME_COPY[p.id]?.tags ?? []), 'live states'],
  status: 'mantle',
  palette: p,
  install: [{ label: 'Apply everywhere with the Mantle mod', command: `/mantle ${p.id}`, where: 'claude-code' }],
  includes: ['Claude Code theme', 'Windows Terminal scheme', 'claude.ai colors'],
}))

// Mantle itself, then the real public catalog (each entry checked against its repo).
const mantlePlugin: Item = {
  id: 'plugin-mantle',
  type: 'plugin',
  name: 'Mantle',
  tagline: 'One theme for Claude Code, Windows Terminal and claude.ai, alive to Claude.',
  description:
    'The theme engine behind every theme here. /mantle opens a studio pane; one apply recolors Claude Code, writes a Windows Terminal profile ' +
    'with your wallpaper and acrylic, and syncs a claude.ai extension. The accent shifts as Claude thinks, runs tools, plans, finishes or errors.',
  author: 'Akshit Tiwari',
  source: { label: 'github.com/AkshitTiwarii/mantle', url: 'https://github.com/AkshitTiwarii/mantle' },
  license: 'MIT',
  tags: ['themes', 'live states', 'terminal'],
  status: 'mantle',
  install: [{ label: 'Install the plugin', command: '/plugin install mantle --marketplace AkshitTiwarii/mantle', where: 'claude-code' }],
  includes: ['/mantle studio pane', 'Windows Terminal profile', 'claude.ai extension', '10 presets'],
}

export const CATALOG: Item[] = [...themes, mantlePlugin, ...REAL_ITEMS]

export function itemById(id: string): Item | undefined {
  return CATALOG.find(i => i.id === id)
}
