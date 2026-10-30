# Changelog

All notable changes to Mantle. Versions follow [Semantic Versioning](https://semver.org); the plugin version lives in `mantle/.claude-plugin/plugin.json`. Run `claude plugin update mantle@mantle` to get the latest.

## 0.3.0 — 2026-10-30

Built around the problems developers report most with AI coding agents.

- **Mantle Doctor** (new skill, `/mantle doctor`): a read-only check-up of your setup. It shows the context every session loads from skill descriptions and CLAUDE.md, lints CLAUDE.md (length, duplicate, vague and stale rules, rules a hook should enforce), catches MCP servers that fail on Windows without `cmd /c` and secrets written into MCP config, and flags risky or missing permission rules with a starter allowlist.
- **Atlas recommend**: `recommend.mjs` reads your project's stack and picks the right skills, connectors and plugins from the curated guides, skipping what you already have.
- **Atlas vet**: `vet.mjs` is a static trust check of a third-party skill before you install it (network pipes into a shell, credential reads, env exfiltration, prompt-injection text, invisible Unicode, obfuscation).
- **Explore** on the website: search all 47,972 skills, connectors and plugins, copy install commands, share searches as links.
- skills.sh now finds Atlas (`skills.sh.json`); the repo has tagged releases and topics.
- README: new header, screenshots, and a problem-to-fix table.

## 0.2.4 — 2026-10-21

- Claude gets its own **Claude · Mantle** tab in Windows Terminal; your other tabs stay plain.
- `/mantle shortcut on` adds a small `claude` function to your PowerShell profile, so typing `claude` opens it in that tab in the same folder (`/mantle shortcut off` removes it).
- Warns when PowerShell's execution policy would skip the shortcut.
- Following Claude across a whole profile is opt-in: `/mantle terminal follow on`.

## 0.2.3 — 2026-10-21

- The wallpaper follows Claude: on when it starts in a tab, off when it quits.

## 0.2.2 — 2026-10-21

- macOS: iTerm2 Dynamic Profile with the palette and wallpaper.
- `/mantle open` starts Claude in a Mantle tab or window in the current folder.
- Windows Terminal picks up changes without a restart.

## 0.2.1 — 2026-10-21

- Fix: wallpapers now show on Windows Terminal 1.24+, which loads fragment images only from the fragment's own folder.
- Clearer messages for claude.ai (how to load the extension) and VS Code (no wallpapers there).

## 0.2.0 — 2026-10-21

- **Mantle Atlas**: a knowledge-base skill covering ~30k skills, ~17k MCP connectors, the official plugin marketplaces, every Claude Code feature and UI customization.
- `/mantle wallpaper` and 48 freely licensed 4K wallpapers on the site.
- Redesigned website: gallery with maker logos, theme maker (build a theme from a wallpaper, locks, undo, share links), "set up with your agent" prompts.

## 0.1.0 — 2026-10-21

- First release: one theme for Claude Code, Windows Terminal and claude.ai, with colors that react to Claude's state, a studio pane (`/mantle`) and a claude.ai Chrome extension.
