# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Claude power users: developers and heavy users of Claude Code and claude.ai who want to make Claude their own and find good themes, skills, connectors (MCP servers) and plugins without hunting across scattered GitHub repos.

## Product Purpose

Mantle puts everything that customizes Claude in one place. The website is the hub: a gallery with live previews and one-click install commands, a theme maker, and "My Claude", a local dashboard of what the visitor already has installed. Success at soft launch is a power user finding something worth installing and installing it in one copy-paste.

## Positioning

Mantle is the only theme system that applies one theme across Claude Code, Windows Terminal (scheme, wallpaper, acrylic) and claude.ai at once, and that reacts live to what Claude is doing (thinking, running tools, plan mode, done, error). Its gallery previews every theme on all three surfaces before install. Existing tools cover one surface each; sharing elsewhere happens through GitHub pull requests.

## Operating Context

- Visitors arrive from a shared link during a soft launch, mostly on desktop, often with Claude Code open in a terminal beside the browser.
- Installing means copying a command into Claude Code (`/plugin install mantle --marketplace AkshitTiwarii/mantle`) or a shell.
- The gallery and theme maker are deployed as a public site. My Claude works only when the local companion (`npm run dev` in `web/`) runs on the visitor's machine; it binds to 127.0.0.1 and reads `~/.claude` read-only, except writing `themes/mantle.json` after confirmation.

## Capabilities and Constraints

- Ten Mantle presets: Ember, Aurora, Synthwave, Tokyo Night, Catppuccin Mocha, Rosé Pine, Nord Night, Forest, Deep Ocean, Paper.
- Live states: idle, thinking, working, plan, done, error.
- The Claude desktop app cannot be themed (integrity-checked bundle).
- Catalog entries other than Mantle's own are a small, clearly labelled sample; some are placeholders.
- Stack: Vite + React + TypeScript front end, a dependency-free Node companion server.

## Brand Commitments

- Name: Mantle. Independent project, not affiliated with Anthropic; no Anthropic or Claude logos or brand assets.
- The user wants the site to look like their ZeroCarbon project (zerocarbon.org.in): binding visual reference.
- License: MIT. Author: Akshit Tiwari. Repository: github.com/AkshitTiwarii/mantle.

## Evidence on Hand

- The Mantle plugin, Chrome extension and 10 presets exist and are published on GitHub.
- No users, testimonials, install counts, ratings or press yet: never fabricate any.

## Product Principles

- One place, not another scattered repo: every listing says exactly how to install it.
- Show, don't describe: themes are judged by live previews on each surface.
- Local stays local: nothing from a visitor's machine leaves it.
- Honest catalog: placeholders are labelled; no invented social proof.
