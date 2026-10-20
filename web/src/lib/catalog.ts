import { PALETTES } from './palettes.js'
import type { Palette } from './palettes.js'

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

const samples: Item[] = [
  // ---- skills ----
  {
    id: 'skill-document-skills',
    type: 'skill',
    name: 'Document Skills',
    tagline: 'Create and edit Word, Excel, PowerPoint and PDF files.',
    description:
      'The docx, xlsx, pptx and pdf skills from the public Agent Skills repository, packaged as one installable plugin.',
    author: 'anthropics/skills',
    source: { label: 'github.com/anthropics/skills', url: 'https://github.com/anthropics/skills' },
    tags: ['documents', 'office', 'pdf'],
    status: 'verified',
    includes: ['docx', 'xlsx', 'pptx', 'pdf'],
    install: [
      { label: 'Add the marketplace', command: '/plugin marketplace add anthropics/skills', where: 'claude-code' },
      { label: 'Install the skills', command: '/plugin install document-skills@anthropic-agent-skills', where: 'claude-code' },
    ],
  },
  {
    id: 'skill-example-skills',
    type: 'skill',
    name: 'Example Skills',
    tagline: 'Design, art, testing and writing skills to learn from or use.',
    description:
      'A set of example skills from the public Agent Skills repository, from frontend design and canvas art to web app testing and skill authoring.',
    author: 'anthropics/skills',
    source: { label: 'github.com/anthropics/skills', url: 'https://github.com/anthropics/skills' },
    tags: ['design', 'testing', 'writing'],
    status: 'verified',
    includes: ['frontend-design', 'canvas-design', 'webapp-testing', 'skill-creator', 'mcp-builder', 'theme-factory', '+6 more'],
    install: [
      { label: 'Add the marketplace', command: '/plugin marketplace add anthropics/skills', where: 'claude-code' },
      { label: 'Install the skills', command: '/plugin install example-skills@anthropic-agent-skills', where: 'claude-code' },
    ],
  },
  {
    id: 'skill-agent-skills',
    type: 'skill',
    name: 'Agent Skills',
    tagline: 'Engineering workflows from spec to ship.',
    description:
      'Structured skills that walk a coding agent through planning, building, testing, reviewing and shipping, the way an experienced engineer would.',
    author: 'Addy Osmani',
    source: { label: 'github.com/addyosmani/agent-skills', url: 'https://github.com/addyosmani/agent-skills' },
    license: 'MIT',
    tags: ['engineering', 'workflow', 'review'],
    status: 'verified',
    install: [
      { label: 'Add the marketplace', command: '/plugin marketplace add addyosmani/agent-skills', where: 'claude-code' },
      { label: 'Install the skills', command: '/plugin install agent-skills@addy-agent-skills', where: 'claude-code' },
    ],
  },
  {
    id: 'skill-release-notes',
    type: 'skill',
    name: 'Release Notes Writer',
    tagline: 'Sample entry: turns merged PRs into readable release notes.',
    description: 'A placeholder showing how a single-skill listing will look. It is not a real, installable skill yet.',
    author: 'Sample',
    tags: ['writing', 'git'],
    status: 'placeholder',
    install: [{ label: 'Placeholder command', command: '/plugin install release-notes@example-marketplace', where: 'claude-code' }],
  },

  // ---- connectors ----
  {
    id: 'connector-playwright',
    type: 'connector',
    name: 'Playwright',
    tagline: 'Drive a real browser: navigate, click, fill forms, read pages.',
    description: 'An MCP server that gives Claude browser automation through Playwright, using the page accessibility tree rather than screenshots.',
    author: 'Microsoft',
    source: { label: 'github.com/microsoft/playwright-mcp', url: 'https://github.com/microsoft/playwright-mcp' },
    license: 'Apache-2.0',
    tags: ['browser', 'testing', 'automation'],
    status: 'verified',
    install: [{ label: 'Add the server (run in your terminal)', command: 'claude mcp add playwright npx @playwright/mcp@latest', where: 'terminal' }],
  },
  {
    id: 'connector-filesystem',
    type: 'connector',
    name: 'Filesystem',
    tagline: 'Read and write files inside folders you allow.',
    description:
      'The reference filesystem MCP server: file operations limited to the directories you pass in. On Windows, wrap the command with `cmd /c`.',
    author: 'Model Context Protocol',
    source: { label: 'github.com/modelcontextprotocol/servers', url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem' },
    license: 'MIT',
    tags: ['files', 'local', 'reference'],
    status: 'verified',
    install: [
      {
        label: 'Add the server (replace the folder path)',
        command: 'claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/folder',
        where: 'terminal',
      },
    ],
  },
  {
    id: 'connector-github',
    type: 'connector',
    name: 'GitHub',
    tagline: 'Issues, pull requests, code search and Actions.',
    description:
      "GitHub's official MCP server, used here through its hosted endpoint. Replace YOUR_GITHUB_PAT with a personal access token; Mantle never sees it.",
    author: 'GitHub',
    source: { label: 'github.com/github/github-mcp-server', url: 'https://github.com/github/github-mcp-server' },
    license: 'MIT',
    tags: ['git', 'code review', 'remote'],
    status: 'verified',
    install: [
      {
        label: 'Add the remote server (run in your terminal)',
        command:
          'claude mcp add-json github \'{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}\'',
        where: 'terminal',
      },
    ],
  },
  {
    id: 'connector-team-wiki',
    type: 'connector',
    name: 'Team Wiki',
    tagline: 'Sample entry: search and cite pages from an internal wiki.',
    description: 'A placeholder showing how a remote connector listing will look. There is no server behind it.',
    author: 'Sample',
    tags: ['docs', 'search', 'remote'],
    status: 'placeholder',
    install: [{ label: 'Placeholder command', command: 'claude mcp add --transport http team-wiki https://wiki.example.com/mcp', where: 'terminal' }],
  },

  // ---- plugins ----
  {
    id: 'plugin-claude-mem',
    type: 'plugin',
    name: 'claude-mem',
    tagline: 'Memory that carries context from one session to the next.',
    description: 'Records what happens in a session, compresses it, and brings the relevant parts back into later sessions.',
    author: 'Alex Newman (thedotmack)',
    source: { label: 'github.com/thedotmack/claude-mem', url: 'https://github.com/thedotmack/claude-mem' },
    tags: ['memory', 'context', 'hooks'],
    status: 'verified',
    install: [
      { label: 'Add the marketplace', command: '/plugin marketplace add thedotmack/claude-mem', where: 'claude-code' },
      { label: 'Install, then restart Claude Code', command: '/plugin install claude-mem', where: 'claude-code' },
    ],
  },
  {
    id: 'plugin-ponytail',
    type: 'plugin',
    name: 'ponytail',
    tagline: 'Pushes toward the simplest code that works.',
    description: 'A "lazy senior dev" mode: YAGNI, standard library first, and no abstractions nobody asked for.',
    author: 'Dietrich Gebert',
    source: { label: 'github.com/DietrichGebert/ponytail', url: 'https://github.com/DietrichGebert/ponytail' },
    license: 'MIT',
    tags: ['style', 'simplicity', 'hooks'],
    status: 'verified',
    install: [
      { label: 'Add the marketplace', command: '/plugin marketplace add DietrichGebert/ponytail', where: 'claude-code' },
      { label: 'Install the plugin', command: '/plugin install ponytail@ponytail', where: 'claude-code' },
    ],
  },
  {
    id: 'plugin-agent-sdk-dev',
    type: 'plugin',
    name: 'agent-sdk-dev',
    tagline: 'A development kit for building with the Agent SDK.',
    description: 'From the official plugin directory: commands and agents that help scaffold and check Agent SDK projects.',
    author: 'claude-plugins-official',
    source: { label: 'github.com/anthropics/claude-plugins-official', url: 'https://github.com/anthropics/claude-plugins-official' },
    license: 'Apache-2.0',
    tags: ['sdk', 'agents', 'development'],
    status: 'verified',
    install: [
      { label: 'Add the marketplace (skip if already added)', command: '/plugin marketplace add anthropics/claude-plugins-official', where: 'claude-code' },
      { label: 'Install the plugin', command: '/plugin install agent-sdk-dev@claude-plugins-official', where: 'claude-code' },
    ],
  },
  {
    id: 'plugin-mantle',
    type: 'plugin',
    name: 'Mantle theme engine',
    tagline: 'The mod behind every theme here: live, cross-surface theming.',
    description:
      'A Claude Code mod with a /mantle studio pane. It writes the live theme, a Windows Terminal profile with wallpaper and acrylic, and syncs a claude.ai browser extension. Public install is not open yet.',
    author: 'Mantle',
    tags: ['themes', 'live states', 'coming soon'],
    status: 'placeholder',
    install: [{ label: 'Open the studio once installed', command: '/mantle', where: 'claude-code' }],
  },
]

export const CATALOG: Item[] = [...themes, ...samples]

export function itemById(id: string): Item | undefined {
  return CATALOG.find(i => i.id === id)
}
