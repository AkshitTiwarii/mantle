# Mantle (web)

Mantle puts the things people use to customize Claude in one place: themes now, then skills, connectors (MCP servers) and plugins. This folder is the first version of the web app.

It has two halves:

- **Gallery (public hub)**: browse, search and filter themes, skills, connectors and plugins. Every theme card renders live previews from its palette: a Claude Code terminal, a claude.ai chat and a Windows Terminal window, and they react when you hover (idle → thinking → working → plan → done → error). Each listing has a one-click **Install** that copies the right command. There's also a **Make a theme** page with live preview and JSON exports.
- **My Claude (local dashboard)**: a small companion server reads your local Claude setup and shows it grouped by type. It runs on your machine only.

Mantle is an independent project and isn't affiliated with Anthropic.

## Run it

Needs Node 20.19+ (tested on Node 22).

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173. `npm run dev` starts both processes:

| Process | Address | What it does |
| --- | --- | --- |
| Web (Vite) | `127.0.0.1:5173` | The app. Proxies `/api` to the companion. |
| Companion | `127.0.0.1:5178` | Reads your Claude folder for **My Claude**. |

Other scripts: `npm run dev:web` (site only), `npm run dev:companion` (companion only), `npm run build` (type-check and production build into `dist/`), `npm run preview` (serve the build; start the companion separately).

Environment variables: `MANTLE_COMPANION_PORT` (default `5178`), `CLAUDE_CONFIG_DIR` (default `~/.claude`, same meaning as in Claude Code).

## What's in the gallery

| Entry | Status |
| --- | --- |
| 10 Mantle themes (Ember, Aurora, Synthwave, Tokyo Night, Catppuccin Mocha, Rosé Pine, Nord Night, Forest, Deep Ocean, Paper) | **Mantle**: generated from `src/lib/palettes.js`, a copy of the Mantle mod's palette module |
| Document Skills, Example Skills (`anthropics/skills`) | **Public repo**: checked |
| Agent Skills (`addyosmani/agent-skills`) | **Public repo**: checked |
| Playwright (`microsoft/playwright-mcp`), Filesystem (`modelcontextprotocol/servers`), GitHub (`github/github-mcp-server`) | **Public repo**: checked |
| claude-mem (`thedotmack/claude-mem`), ponytail (`DietrichGebert/ponytail`), agent-sdk-dev (`anthropics/claude-plugins-official`) | **Public repo**: checked |
| Release Notes Writer, Team Wiki | **Placeholder**: sample listings, not installable |
| Mantle theme engine | **Placeholder**: the mod isn't publicly installable yet |

"Checked" means the repo and the install command in its README were verified on 2026-10-21. Listings live in `src/lib/catalog.ts`.

Install commands use Claude Code's real syntax: `/plugin marketplace add <owner>/<repo>`, then `/plugin install <plugin>@<marketplace>`. Multi-step installs open a small panel with one copy button per step, because two slash commands can't be pasted as one prompt. Connectors copy a `claude mcp add …` command to run in a system terminal.

Theme installs copy `/mantle <preset>`, which needs the Mantle mod. Without the mod, each theme page exports:

- **Claude Code theme**: save as `~/.claude/themes/<name>.json`, then pick it in `/theme`.
- **Windows Terminal scheme**: paste into `"schemes"` in Windows Terminal's `settings.json`.
- **claude.ai extension payload**: the `mantle-theme.json` that the Mantle browser extension reads.
- **Mantle palette**: the source palette.

The theme maker derives surfaces, borders and all 16 ANSI colors from 8 picked colors, warns about low contrast, and exports the same four files.

## My Claude: what the companion reads

Read-only:

- `~/.claude/settings.json` and `settings.local.json`: theme, model, `enabledPlugins`, `extraKnownMarketplaces`, `mcpServers`
- `~/.claude/plugins/installed_plugins.json`, `known_marketplaces.json`, each plugin's manifest, skills, commands, agents, hooks and `.mcp.json`
- `~/.claude/plugins/synced/*`: plugins synced from your account
- `~/.claude/skills/*/SKILL.md` and `~/.claude/skills/synced/*/manifest.json`
- `~/.claude/themes/*.json`
- `~/.claude.json`: only `mcpServers` and `projects.*.mcpServers`; nothing else in that file is read out
- Mantle outputs: `themes/mantle.json`, `~/.claude/mantle/chrome-extension/mantle-theme.json`, the Windows Terminal fragment under `%LOCALAPPDATA%`, and the studio config if it's found under `plugins/data/mantle*`

It never opens `.credentials.json`.

**One write action:** **Apply on this computer** writes `~/.claude/themes/mantle.json` (the file the Mantle mod's live theme uses). Before writing, the UI shows the target file and what it replaces, and asks you to confirm. Undo restores the previous content; it's kept in the companion's memory only. Nothing else is ever written.

### Privacy and safety

- The companion listens on `127.0.0.1` only and makes no network requests.
- It rejects requests whose `Host` isn't a loopback name, which blocks DNS rebinding. It also rejects cross-site `Origin`s. Writes require a loopback `Origin`, `Content-Type: application/json` and `confirm: true`.
- MCP configs are redacted before they leave the companion. Env values and header values become `••••••` (only the key names are shown). Credentials and query values are stripped from URLs. Secret-looking args are masked (`--token x`, `KEY=value`, `sk-…`, `ghp_…`, JWTs, long hex or base64), and inline scripts (`-e`, `-c`) are hidden.
- The site makes no external requests at runtime: no analytics, fonts or CDNs.

## Layout

```
server/
  index.mjs      companion HTTP server (routes, guards, the one write)
  scan.mjs       read-only scan of the Claude folder
  redact.mjs     secret redaction for MCP configs
scripts/dev.mjs  runs companion + Vite together
src/
  lib/palettes.js   Mantle palette module (copied from the mod; keep in sync)
  lib/catalog.ts    gallery listings
  lib/exports.ts    export formats + theme-maker palette derivation
  components/       previews, cards, install button, apply dialog
  pages/            Hub, Detail, Maker, MyClaude
```

`src/lib/palettes.js` is a verbatim copy of `prism/chrome-extension/palettes.js` from the Mantle mod. When the mod's palettes change, copy the file again.
