# Plugins and marketplaces for Claude

Purpose: tell an agent what Claude plugins and marketplaces exist, what each plugin is for, when to pick it, and the exact commands to install it.

Collected 2026-10-21. Sources: `anthropics/claude-plugins-official` (marketplace.json + repo tree), `anthropics/knowledge-work-plugins`, `anthropics/claude-plugins-community`, authors' own `.claude-plugin/marketplace.json` files and READMEs, `hesreallyhim/awesome-claude-code`, and code.claude.com/docs/en/plugins/*. Catalogs change weekly: when in doubt, run `/plugin` and read the plugin's details pane.

---

## 1. Primer

### What a plugin bundles

A plugin is a folder with an optional `.claude-plugin/plugin.json` manifest (only `name` is required) plus any of these components, each in its default location:

| Component | Where it lives | What it does |
| --- | --- | --- |
| Skills | `skills/<name>/SKILL.md` | Instructions Claude loads when a request matches the description; also runnable as `/<plugin>:<skill>` |
| Commands | `commands/<name>.md` | Slash commands (older form of user-invoked skills) |
| Agents | `agents/<name>.md` | Subagents with their own prompt, tools and model |
| Hooks | `hooks/hooks.json` | Shell/HTTP/prompt handlers on events (PreToolUse, Stop, SessionStart, ...) |
| MCP servers | `.mcp.json` or `mcpServers` in the manifest | Tools from local or remote MCP servers; can be a packaged MCPB server |
| LSP servers | `.lsp.json` or `lspServers` | Language servers for live diagnostics and go-to-definition |
| Themes | `themes/<slug>.json` | Color themes that show up in `/theme` (manifest key `experimental.themes`) |
| Output styles | `output-styles/<name>.md` | Styles that show up in `/output-style` as `<plugin>:<name>` |
| Monitors | `monitors/monitors.json` | Background commands whose output reaches Claude as notifications |
| Channels | `channels` in the manifest | Let an outside chat app (Telegram, Discord, ...) send messages into a session |
| Executables | `bin/` | Put on PATH while the plugin is enabled |
| Default settings | `settings.json` | Only `agent` and `subagentStatusLine` take effect |
| Mods | a hooks module (JS/TS) | Run inside Claude Code: draw panes, bands, restyle the spinner or tool rows, add instant `/commands`, guard tool calls. Work in the CLI, the desktop app's Code tab and VS Code |

Plugins can run code on your machine (hooks, MCP servers, mods). Read the details pane before installing anything from a marketplace you don't know; Anthropic does not review third-party marketplaces.

### Add a marketplace

A marketplace is a repo (or URL) with `.claude-plugin/marketplace.json`. Add it once:

```text
/plugin marketplace add owner/repo            # GitHub; append #tag to pin
/plugin marketplace add https://host/x.git    # any git host
/plugin marketplace add ./local-folder        # local path (must start with ./ or ../)
/plugin marketplace add https://example.com/marketplace.json
```

Shell equivalent: `claude plugin marketplace add owner/repo`. The name you type after `@` when installing is the marketplace's `name` field, which can differ from the repo name (e.g. `wshobson/agents` registers as `claude-code-workflows`). Claude Code prints it after adding.

`claude-plugins-official` is added automatically the first time you start an interactive terminal session. If it's missing: `/plugin marketplace add anthropics/claude-plugins-official`.

### Install

```text
/plugin install <plugin>@<marketplace>                 # opens the details pane; pick a scope there
/plugin install <plugin> --marketplace owner/repo      # add marketplace + install in one step (v2.1.275+)
/plugin                                                # browse: Discover / Installed / Marketplaces / Errors tabs
```

From a shell (no session): `claude plugin install <plugin>@<marketplace> [--scope user|project|local]`, or `claude plugin install <plugin> --marketplace owner/repo` (v2.1.292+). Shell installs load next session or after `/reload-plugins`.

After installing, check the summary line: "Plugin is now active", or "Run /reload-plugins to apply". Plugin skills appear as `/<plugin>:<skill>`.

### Scopes

| Scope | Who gets it | Written to |
| --- | --- | --- |
| User (default for shell installs) | You, every project on this machine | `~/.claude/settings.json` (`enabledPlugins`) |
| Project | Everyone in the repo (each collaborator still runs `claude plugin install <p>@<m> --scope project` once) | `.claude/settings.json` |
| Local | You, this repo only | `.claude/settings.local.json` |

Local overrides project, project overrides user. Terminal, desktop local sessions and VS Code on one machine share these files. Managed scope (org-installed) can't be changed by the user.

### Manage and update

- Enable / disable / uninstall: `/plugin` → Installed (Space toggles, Enter opens details), or `claude plugin enable|disable|uninstall <p>@<m> [--scope ...]`.
- Update one plugin: Installed → **Update now**, or `claude plugin update <p>@<m>`.
- Update everything from one marketplace: Marketplaces tab → **Update marketplace**. `claude plugin marketplace update` with no name only refreshes listings.
- Auto-update is on by default for `claude-plugins-official` (and marketplaces added from claude.ai), off for community and third-party marketplaces (`knowledge-work-plugins` too). Toggle it per marketplace on the Marketplaces tab.
- Running sessions keep the loaded version; run `/reload-plugins` (or `--force` if it warns about the prompt cache).
- `claude plugin list` shows version/scope/status; `claude plugin details <p>` shows the always-on token cost; the Installed tab groups plugins "Not used recently".
- Remove a marketplace: `/plugin marketplace remove <name>` (uninstalls its plugins).
- Test a plugin from disk without installing: `claude --plugin-dir ./my-plugin`.

### Other surfaces

- **Claude desktop app (Code tab, local or SSH session):** click **+** next to the prompt box → **Add plugins** (or **Plugins** → **Browse plugins**), select the plugin, choose a scope. To add a third-party marketplace there: **+** → **Plugins** → **Add marketplace** with `owner/repo`, then add the plugin. `/plugin` does not run in the desktop app.
- **VS Code:** type `/plugins` → Manage plugins; add marketplaces on its Marketplaces tab.
- **JetBrains:** use the terminal steps. **`claude -p`:** `/plugin` isn't available; use `claude plugin ...` from the shell.
- **Cloud sessions (claude.ai/code):** no plugin browser; local plugins don't load. Org plugins come via managed settings.
- **claude.ai / Cowork:** plugins turned on in your claude.ai account (or by your org) sync into Claude Code as `<name>@synced`. See claude.com/docs/plugins/overview. The web catalog is claude.com/marketplace/plugins (shows install counts and an "Anthropic verified" mark).

---

## 2. Marketplaces

| Marketplace (name after `@`) | Repo | Add command | What's in it |
| --- | --- | --- | --- |
| `claude-plugins-official` | anthropics/claude-plugins-official | added automatically (else `/plugin marketplace add anthropics/claude-plugins-official`) | ~315 plugins: Anthropic's own (commit-commands, code-review, feature-dev, LSPs, output styles...) plus vetted partner plugins (GitHub, Figma, Stripe, Vercel, Sentry, Supabase...) |
| `knowledge-work-plugins` | anthropics/knowledge-work-plugins | `/plugin marketplace add anthropics/knowledge-work-plugins` | ~123 role plugins built for Cowork and Claude Code: sales, legal, finance, support, marketing, PM, HR, ops, design, data, plus partner plugins |
| `claude-community` | anthropics/claude-plugins-community | `/plugin marketplace add anthropics/claude-plugins-community` | ~2,280 third-party plugins submitted to Anthropic (status lines, sounds, memory, pets, workflows) |
| `claude-code-plugins` (demo) | anthropics/claude-code | `/plugin marketplace add anthropics/claude-code` | 13 example plugins; most duplicate official ones, so install those from `claude-plugins-official` instead |
| `anthropic-agent-skills` | anthropics/skills | `/plugin marketplace add anthropics/skills` | `document-skills` (docx/xlsx/pptx/pdf), `example-skills`, `claude-api`, `academy-guide`, `discernment-nudge` |
| `superpowers-marketplace` | obra/superpowers-marketplace | `/plugin marketplace add obra/superpowers-marketplace` | superpowers, superpowers-chrome, elements-of-style, episodic-memory, superpowers-lab, claude-session-driver, private-journal-mcp, double-shot-latte |
| `claude-code-workflows` | wshobson/agents | `/plugin marketplace add wshobson/agents` | 94 focused plugins (python-development, tdd-workflows, kubernetes-operations, security-scanning, ...) |
| `awesome-claude-code-plugins` | ccplugins/awesome-claude-code-plugins | `/plugin marketplace add ccplugins/awesome-claude-code-plugins` | ~150 small command/agent plugins (commit, pr-review, bug-detective, ...) |
| `compound-engineering-plugin` | EveryInc/compound-engineering-plugin | `/plugin marketplace add EveryInc/compound-engineering-plugin` | compound-engineering |
| `thedotmack` | thedotmack/claude-mem | `/plugin marketplace add thedotmack/claude-mem` | claude-mem, claude-mem-cowork |
| `claude-hud` | jarrodwatts/claude-hud | `/plugin marketplace add jarrodwatts/claude-hud` | claude-hud status line |
| `claude-powerline` | Owloops/claude-powerline | `/plugin marketplace add Owloops/claude-powerline` | claude-powerline status line |
| `mantle` | AkshitTiwarii/mantle | `/plugin marketplace add AkshitTiwarii/mantle` | mantle (cross-surface theming; see ui-customization.md) |

Single-plugin author marketplaces also exist for `caveman` (JuliusBrussee/caveman), `impeccable` (pbakaus/impeccable), `tdd-guard` (nizos/tdd-guard), `prismantis` (NahumLitvin/prismantis), `starship-claude` (martinemde/starship-claude), `context-mode` (mksglu/context-mode).

Discovery lists (not marketplaces): `hesreallyhim/awesome-claude-code` (curated table of skills, hooks, status lines, mods, tools), claude.com/marketplace/plugins.

---

## 3. Notable plugins by job

Convention: "official" = `claude-plugins-official` (no marketplace add needed). "Includes" lists only components verified in the plugin's repo tree; "not verified" means check the **Will install** list in `/plugin` before installing.

### Development workflow

### feature-dev — official (Anthropic)
- **What:** Guided feature build: explore the codebase, design an architecture, implement, then review.
- **Use when:** A non-trivial feature needs understanding before code.
- **Install:** `/plugin install feature-dev@claude-plugins-official`
- **Includes:** command `feature-dev`; agents `code-explorer`, `code-architect`, `code-reviewer`.

### commit-commands — official (Anthropic)
- **What:** One-step git commit, commit-push-PR, and cleanup of branches whose remote is gone.
- **Use when:** You want consistent commits and PRs without typing git sequences.
- **Install:** `/plugin install commit-commands@claude-plugins-official`
- **Includes:** commands `commit`, `commit-push-pr`, `clean_gone`.

### ralph-loop — official (Anthropic)
- **What:** Re-feeds the same task to Claude in a loop (the "Ralph Wiggum" technique) until it reports completion.
- **Use when:** Long, well-specified tasks that benefit from repeated self-correcting passes.
- **Install:** `/plugin install ralph-loop@claude-plugins-official`
- **Includes:** commands `ralph-loop`, `cancel-ralph`, `help`; Stop hook.

### hookify — official (Anthropic)
- **What:** Turns plain-language rules ("never run rm -rf", "warn on console.log") into hooks, or mines the conversation for unwanted behaviors to block.
- **Use when:** You want guardrails without hand-writing hook JSON.
- **Install:** `/plugin install hookify@claude-plugins-official`
- **Includes:** commands `hookify`, `list`, `configure`, `help`; agent `conversation-analyzer`; skill `writing-rules`; PreToolUse/PostToolUse/Stop/UserPromptSubmit hooks.

### claude-code-setup — official (Anthropic)
- **What:** Scans a repo and recommends hooks, skills, MCP servers and subagents that fit it.
- **Use when:** Onboarding Claude Code to a new codebase.
- **Install:** `/plugin install claude-code-setup@claude-plugins-official`
- **Includes:** skill `claude-automation-recommender`.

### plugin-dev — official (Anthropic)
- **What:** Toolkit for authoring plugins: structure, hooks, MCP, commands, agents, settings, plus a validator.
- **Use when:** Building or debugging your own plugin.
- **Install:** `/plugin install plugin-dev@claude-plugins-official`
- **Includes:** command `create-plugin`; agents `agent-creator`, `plugin-validator`, `skill-reviewer`; 7 skills (plugin-structure, hook-development, mcp-integration, command-development, agent-development, skill-development, plugin-settings).

### skill-creator — official (Anthropic)
- **What:** Create, improve and benchmark Agent Skills with evals.
- **Use when:** Writing a new skill or tuning a skill's triggering/quality.
- **Install:** `/plugin install skill-creator@claude-plugins-official`
- **Includes:** skill `skill-creator`.

### agent-sdk-dev — official (Anthropic)
- **What:** Scaffold and verify Claude Agent SDK apps in Python or TypeScript.
- **Use when:** Starting an Agent SDK project.
- **Install:** `/plugin install agent-sdk-dev@claude-plugins-official`
- **Includes:** command `new-sdk-app`; agents `agent-sdk-verifier-py`, `agent-sdk-verifier-ts`.

### mcp-server-dev — official (Anthropic)
- **What:** Guidance for designing and shipping MCP servers (remote HTTP, MCPB, local, MCP apps).
- **Use when:** Building an MCP server for Claude.
- **Install:** `/plugin install mcp-server-dev@claude-plugins-official`
- **Includes:** skills `build-mcp-server`, `build-mcp-app`, `build-mcpb`.

### code-modernization — official (Anthropic)
- **What:** Assess a legacy codebase, map it, extract business rules, then plan and run an upgrade or rewrite you approve.
- **Use when:** Migrating or modernizing old systems.
- **Install:** `/plugin install code-modernization@claude-plugins-official`
- **Includes:** commands `modernize`, `modernize-assess`, `modernize-map`, `modernize-extract-rules`, `modernize-transform`, `modernize-verify` and more; 8 agents (legacy-analyst, business-rules-extractor, architecture-critic, test-engineer, ...); hooks.

### playground — official (Anthropic)
- **What:** Builds single-file interactive HTML "playgrounds" with controls, live preview and a copyable prompt output.
- **Use when:** Exploring a design, dataset or concept visually before committing.
- **Install:** `/plugin install playground@claude-plugins-official`
- **Includes:** skill `playground`.

### superpowers — official / obra/superpowers-marketplace
- **What:** A methodology library: brainstorm a spec, write a plan, execute with subagents, TDD, systematic debugging, and verify before claiming done.
- **Use when:** You want Claude to follow a disciplined plan-build-review loop on every task.
- **Install:** `/plugin install superpowers@claude-plugins-official` (or `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install superpowers@superpowers-marketplace`)
- **Includes:** skills `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, `using-git-worktrees`, `requesting-code-review`, `verification-before-completion` and more; SessionStart hook.

### compound-engineering — EveryInc/compound-engineering-plugin
- **What:** 36 skills built around brainstorm → plan → build → review → write down what was learned so the next change benefits.
- **Use when:** Teams that want accumulated project knowledge to feed future work.
- **Install:** `/plugin marketplace add EveryInc/compound-engineering-plugin` then `/plugin install compound-engineering@compound-engineering-plugin`. Refresh the marketplace before updating.
- **Includes:** skills prefixed `ce-` (e.g. `ce-explain`, `ce-pov`); full list not verified.

### claude-code-workflows (94 plugins) — wshobson/agents
- **What:** A large catalog of narrow plugins, each bundling agents/skills/commands for one domain (python-development, tdd-workflows, kubernetes-operations, security-scanning, database-migrations, ...).
- **Use when:** You want domain specialists without installing a giant bundle.
- **Install:** `/plugin marketplace add wshobson/agents` then e.g. `/plugin install python-development@claude-code-workflows`
- **Includes:** varies per plugin; see the repo's docs/plugins.md.

### tdd-guard — nizos/tdd-guard
- **What:** Hooks that block edits which skip a failing test or over-implement, and explain what to do instead.
- **Use when:** You want TDD enforced, not just suggested.
- **Install:** `/plugin marketplace add nizos/tdd-guard` then `/plugin install tdd-guard@tdd-guard`
- **Includes:** hooks (per README); details not verified.

### github — official (external_plugins)
- **What:** GitHub's official MCP server: issues, PRs, reviews, code search, the full API.
- **Use when:** Claude needs to act on GitHub beyond local git.
- **Install:** `/plugin install github@claude-plugins-official`
- **Includes:** MCP server (`.mcp.json`).

### gitlab — official (external_plugins)
- **What:** GitLab MCP: repos, merge requests, pipelines, issues, wikis.
- **Use when:** Your code lives on GitLab.
- **Install:** `/plugin install gitlab@claude-plugins-official`
- **Includes:** MCP server.

### linear — official (external_plugins)
- **What:** Linear issues and projects from Claude Code.
- **Use when:** You track work in Linear.
- **Install:** `/plugin install linear@claude-plugins-official`
- **Includes:** MCP server.

### context7 — official (external_plugins)
- **What:** Pulls current, version-specific library docs from Upstash's hosted Context7 MCP.
- **Use when:** Claude's knowledge of a library may be stale.
- **Install:** `/plugin install context7@claude-plugins-official`
- **Includes:** MCP server (remote, no local Node needed).

### playwright — official (external_plugins)
- **What:** Microsoft's Playwright MCP: drive a browser, click, fill forms, screenshot, run E2E checks.
- **Use when:** Testing or verifying a web UI.
- **Install:** `/plugin install playwright@claude-plugins-official`
- **Includes:** MCP server.

### chrome-devtools-mcp — official (ChromeDevTools)
- **What:** Inspect a live Chrome: performance traces, network, console, LCP, memory leaks, a11y.
- **Use when:** Debugging front-end performance or runtime issues.
- **Install:** `/plugin install chrome-devtools-mcp@claude-plugins-official`
- **Includes:** skills `chrome-devtools`, `debug-optimize-lcp`, `memory-leak-debugging`, `a11y-debugging`, `cookie-debugging`, `troubleshooting`, `chrome-devtools-cli`.

### terraform — official (external_plugins)
- **What:** HashiCorp's Terraform MCP server for IaC work.
- **Use when:** Writing or reviewing Terraform.
- **Install:** `/plugin install terraform@claude-plugins-official`
- **Includes:** MCP server.

### vercel — official (Vercel)
- **What:** Deploy, inspect builds/logs, env vars, domains, plus deep Vercel/AI SDK guidance.
- **Use when:** Shipping to Vercel or using the AI SDK.
- **Install:** `/plugin install vercel@claude-plugins-official`
- **Includes:** commands `deploy`, `env`, `status`, `bootstrap`; agents `deployment-expert`, `performance-optimizer`, `ai-architect`; many skills (`ai-sdk`, `ai-gateway`, `env-vars`, ...); MCP; hooks.

### cloudflare — official (Cloudflare)
- **What:** Skills for Workers, Durable Objects, Agents SDK, Wrangler and web performance.
- **Use when:** Building on Cloudflare.
- **Install:** `/plugin install cloudflare@claude-plugins-official`
- **Includes:** MCP; skills `wrangler`, `durable-objects`, `agents-sdk`, `workers-best-practices`, `web-perf`, ...

### stripe — official (Stripe)
- **What:** Stripe integration help: best practices, docs lookup, API upgrades, error explanations, test cards.
- **Use when:** Building or debugging payments code.
- **Install:** `/plugin install stripe@claude-plugins-official`
- **Includes:** commands `explain-error`, `test-cards`; skills `stripe-best-practices`, `stripe-docs`, `upgrade-stripe`, ...; MCP; hooks.

### sentry — official (Sentry)
- **What:** Set up Sentry, debug issues and fix stack traces, alerts and releases.
- **Use when:** Investigating production errors.
- **Install:** `/plugin install sentry@claude-plugins-official`
- **Includes:** skills `sentry-get-started`, `sentry-debug-issue`, `sentry-fix-stack-traces`, `sentry-instrument`, `sentry-create-alert`, `sentry-setup-releases`, ...

### Code review & quality

### code-review — official (Anthropic)
- **What:** Multi-agent PR review with confidence scoring to drop false positives.
- **Use when:** Reviewing a PR before merge.
- **Install:** `/plugin install code-review@claude-plugins-official`
- **Includes:** command `code-review`.

### pr-review-toolkit — official (Anthropic)
- **What:** Specialist reviewers for comments, tests, silent failures, type design, quality and simplification.
- **Use when:** You want a deeper, aspect-by-aspect review.
- **Install:** `/plugin install pr-review-toolkit@claude-plugins-official`
- **Includes:** command `review-pr`; agents `code-reviewer`, `code-simplifier`, `comment-analyzer`, `pr-test-analyzer`, `silent-failure-hunter`, `type-design-analyzer`.

### code-simplifier — official (Anthropic)
- **What:** An agent that tidies recently changed code for clarity without changing behavior.
- **Use when:** After a feature lands and the diff feels heavy.
- **Install:** `/plugin install code-simplifier@claude-plugins-official`
- **Includes:** agent `code-simplifier`.

### coderabbit — official (CodeRabbit)
- **What:** External AI review backed by 40+ static analyzers, with autofix.
- **Use when:** You want a second reviewer that isn't Claude.
- **Install:** `/plugin install coderabbit@claude-plugins-official`
- **Includes:** commands `coderabbit`, `coderabbit-review`; agent `code-reviewer`; skills `code-review`, `autofix`.

### greptile — official (Greptile)
- **What:** View/resolve Greptile PR comments and run reviews on your branch.
- **Use when:** Your team already uses Greptile on GitHub/GitLab.
- **Install:** `/plugin install greptile@claude-plugins-official`
- **Includes:** commands `review`, `login`; MCP server.

### sonarqube — official (SonarSource)
- **What:** Puts SonarQube rules, quality gates, coverage, duplication and dependency risks into the agent loop.
- **Use when:** Your org gates merges on SonarQube.
- **Install:** `/plugin install sonarqube@claude-plugins-official`
- **Includes:** agent `sonarqube-reviewer`; skills `sonar-analyze`, `sonar-quality-gate`, `sonar-fix-issue`, `sonar-list-issues`, ...

### qodo — official (Qodo)
- **What:** Codebase knowledge, coding standards and review from Qodo.
- **Use when:** Enforcing team standards during review.
- **Install:** `/plugin install qodo@claude-plugins-official`
- **Includes:** skills `qodo-review`, `qodo-review-resolver`, `qodo-codebase-wisdom`, `qodo-setup`, `qodo-review-notes`.

### Security

### security-guidance — official (Anthropic)
- **What:** Warns on risky edits as they happen, reviews the diff when Claude stops, and checks commits for injection, XSS, SSRF, secrets and more.
- **Use when:** Always-on safety net while Claude writes code.
- **Install:** `/plugin install security-guidance@claude-plugins-official`
- **Includes:** hooks (pattern warnings, LLM diff review, commit reviewer).

### claude-security — official (Anthropic)
- **What:** Deep vulnerability scan of your own repo at a chosen effort tier; each finding is challenged before it's reported, then patches are generated and verified.
- **Use when:** A periodic or pre-release security audit.
- **Install:** `/plugin install claude-security@claude-plugins-official`
- **Includes:** skill `claude-security`; agents (scan-researcher, scan-verifier, patch-generator, patch-verifier, ...); hooks.

### semgrep — official (Semgrep)
- **What:** Real-time Semgrep scanning so Claude writes secure code from the start.
- **Use when:** You use Semgrep rules or want SAST in the loop.
- **Install:** `/plugin install semgrep@claude-plugins-official`
- **Includes:** MCP server; hooks; skills for adding/removing guardian rules.

### aikido — official (Aikido)
- **What:** SAST, secrets and IaC scanning through Aikido's MCP.
- **Use when:** Your org uses Aikido.
- **Install:** `/plugin install aikido@claude-plugins-official`
- **Includes:** MCP; skills `scan`, `issues`, `pr-comments`, `setup`.

### 42crunch-api-security-testing — official (42Crunch)
- **What:** Audits OpenAPI specs and tests APIs against OWASP API Top 10.
- **Use when:** Securing REST APIs.
- **Install:** `/plugin install 42crunch-api-security-testing@claude-plugins-official`
- **Includes:** not verified.

### Frontend & design

### frontend-design — official (Anthropic)
- **What:** Pushes Claude toward distinctive, production-grade UI instead of generic "AI look".
- **Use when:** Building pages or components where visual quality matters.
- **Install:** `/plugin install frontend-design@claude-plugins-official`
- **Includes:** skill `frontend-design`.

### impeccable — pbakaus/impeccable
- **What:** Design vocabulary as commands: shape, craft, critique, audit, polish, bolder/quieter, with PRODUCT.md/DESIGN.md context.
- **Use when:** You want to direct UI quality in designer terms.
- **Install:** `/plugin marketplace add pbakaus/impeccable` then `/plugin install impeccable@impeccable` (alt: `npx impeccable install` in the project). Start with `/impeccable init`.
- **Includes:** `/impeccable` subcommands `init`, `craft`, `shape`, `critique`, `audit`, `polish`, `document`, `extract`, `bolder`, ...

### figma — official (Figma)
- **What:** Figma MCP plus skills to turn designs into code, generate designs/libraries/diagrams, and use Code Connect.
- **Use when:** Implementing from Figma or writing back to it.
- **Install:** `/plugin install figma@claude-plugins-official`
- **Includes:** MCP; skills `figma-design-to-code`, `figma-code-connect`, `figma-generate-design`, `figma-generate-library`, `figma-use-figjam`, ...

### canva — official (Canva)
- **What:** Create, edit, resize and brand-check Canva designs.
- **Use when:** Marketing assets or social variants.
- **Install:** `/plugin install canva@claude-plugins-official`
- **Includes:** MCP; skills `edit-design`, `bulk-create`, `brand-check`, `resize-for-social-media`, `get-design-feedback`, `implement-feedback`.

### design — knowledge-work-plugins
- **What:** Design-team workflows: critique, design systems, UX copy, accessibility review, research synthesis, dev handoff.
- **Use when:** Product designers working in Cowork or Claude Code.
- **Install:** `/plugin marketplace add anthropics/knowledge-work-plugins` then `/plugin install design@knowledge-work-plugins`
- **Includes:** skills `design-critique`, `design-system`, `ux-copy`, `accessibility-review`, `user-research`, `research-synthesis`, `design-handoff`; MCP config.

### Language / LSP & code intelligence

All Anthropic-maintained, official marketplace. The plugin only wires up the server: install the binary first and make sure it's on PATH, then `/plugin install <plugin>@claude-plugins-official`. Gives Claude live diagnostics after each edit and symbol navigation. Not started in cloud sessions.

| Plugin | Language | Binary you install |
| --- | --- | --- |
| typescript-lsp | TS/JS | `typescript-language-server` (`npm install -g typescript-language-server typescript`) |
| pyright-lsp | Python | `pyright-langserver` |
| gopls-lsp | Go | `gopls` |
| rust-analyzer-lsp | Rust | `rust-analyzer` |
| clangd-lsp | C/C++ | `clangd` |
| jdtls-lsp | Java | `jdtls` |
| kotlin-lsp | Kotlin | `kotlin-lsp` |
| csharp-lsp | C# | `csharp-ls` |
| php-lsp | PHP | `intelephense` |
| ruby-lsp | Ruby | `ruby-lsp` |
| swift-lsp | Swift | `sourcekit-lsp` |
| lua-lsp | Lua | `lua-language-server` |
| liquid-lsp (Shopify) | Liquid | `shopify` (Shopify CLI) |

### serena — official (external_plugins)
- **What:** Semantic code analysis MCP built on language servers: symbol-level navigation and refactoring.
- **Use when:** Large codebases where text search is too blunt and you want one server across languages.
- **Install:** `/plugin install serena@claude-plugins-official`
- **Includes:** MCP server.

### Data

### data — knowledge-work-plugins
- **What:** SQL, data exploration, stats, validation, charts and dashboards.
- **Use when:** Analysts turning raw data into answers.
- **Install:** `/plugin marketplace add anthropics/knowledge-work-plugins` then `/plugin install data@knowledge-work-plugins`
- **Includes:** skills `write-query`, `sql-queries`, `explore-data`, `analyze`, `statistical-analysis`, `validate-data`, `create-viz`, `build-dashboard`, `data-visualization`, `data-context-extractor`; MCP config.

### supabase — official (Supabase)
- **What:** Supabase projects, Postgres, auth and storage guidance.
- **Use when:** Building on Supabase.
- **Install:** `/plugin install supabase@claude-plugins-official`
- **Includes:** skills `supabase`, `supabase-postgres-best-practices`.

### mongodb — official (MongoDB)
- **What:** MongoDB MCP setup plus schema design, query optimization, search/vector skills.
- **Use when:** Working with MongoDB or Atlas.
- **Install:** `/plugin install mongodb@claude-plugins-official`
- **Includes:** skills `mongodb-connection`, `mongodb-mcp-setup`, `mongodb-schema-design`, `mongodb-query-optimizer`, `mongodb-search-and-ai`, ...

### neon — official (Neon)
- **What:** Neon serverless Postgres: branches, auth, functions, egress tuning.
- **Use when:** Using Neon databases.
- **Install:** `/plugin install neon@claude-plugins-official`
- **Includes:** skills `neon`, `neon-postgres`, `neon-postgres-branches`, `neon-auth`, `neon-functions`, ...

### databricks — official (Databricks)
- **What:** Databricks CLI, Apps, DBSQL, jobs, bundles, Genie and AI functions.
- **Use when:** Lakehouse work on Databricks.
- **Install:** `/plugin install databricks@claude-plugins-official`
- **Includes:** commands `setup`, `doctor`; hooks; many `databricks-*` skills.

### posthog — official (PostHog)
- **What:** PostHog analytics, flags, experiments, error tracking and dashboards from Claude.
- **Use when:** Product analytics questions or instrumentation.
- **Install:** `/plugin install posthog@claude-plugins-official`
- **Includes:** MCP; hooks; agent `error-analyzer`; many skills (`building-a-dashboard`, `auditing-experiments-flags`, ...).

### Knowledge work (sales, legal, finance, support, marketing, PM, HR, ops)

All from `knowledge-work-plugins`. Add once: `/plugin marketplace add anthropics/knowledge-work-plugins`. Each ships skills plus an `.mcp.json` of suggested connectors (CRM, email, docs). Skills run as `/<plugin>:<skill>`. Also installable on claude.ai/Cowork, where they sync into Claude Code.

### sales — knowledge-work-plugins
- **What:** Call prep and summaries, account research, pipeline and deal reviews, forecasting, outreach drafts.
- **Use when:** AEs, SDRs and sales managers.
- **Install:** `/plugin install sales@knowledge-work-plugins`
- **Includes:** 36 skills incl. `call-prep`, `call-summary`, `account-research`, `pipeline-review`, `forecast`, `draft-outreach`, `deal-review`, `handle-objection`, `daily-briefing`.

### legal — knowledge-work-plugins
- **What:** Contract review against a playbook, NDA triage, compliance checks, risk assessment, templated responses.
- **Use when:** In-house legal teams.
- **Install:** `/plugin install legal@knowledge-work-plugins`
- **Includes:** skills `review-contract`, `triage-nda`, `compliance-check`, `legal-risk-assessment`, `legal-response`, `vendor-check`, `brief`, `meeting-briefing`, `signature-request`.

### finance — knowledge-work-plugins
- **What:** Journal entries, reconciliations, close management, statements, variance analysis, audit/SOX support.
- **Use when:** Accounting and FP&A work.
- **Install:** `/plugin install finance@knowledge-work-plugins`
- **Includes:** skills `journal-entry`, `journal-entry-prep`, `reconciliation`, `close-management`, `financial-statements`, `variance-analysis`, `audit-support`, `sox-testing`.

### customer-support — knowledge-work-plugins
- **What:** Ticket triage, response drafts, escalations, customer research, KB articles from resolved issues.
- **Use when:** Support agents and leads.
- **Install:** `/plugin install customer-support@knowledge-work-plugins`
- **Includes:** skills `ticket-triage`, `draft-response`, `customer-escalation`, `customer-research`, `kb-article`.

### marketing — knowledge-work-plugins
- **What:** Campaign plans, content drafts, email sequences, brand review, SEO audits, performance reports.
- **Use when:** Marketing teams.
- **Install:** `/plugin install marketing@knowledge-work-plugins`
- **Includes:** skills `campaign-plan`, `content-creation`, `draft-content`, `email-sequence`, `brand-review`, `seo-audit`, `competitive-brief`, `performance-report`.

### product-management — knowledge-work-plugins
- **What:** Specs, roadmaps, sprint planning, research synthesis, stakeholder updates, metrics reviews.
- **Use when:** PMs.
- **Install:** `/plugin install product-management@knowledge-work-plugins`
- **Includes:** skills `write-spec`, `roadmap-update`, `sprint-planning`, `synthesize-research`, `stakeholder-update`, `metrics-review`, `competitive-brief`, `product-brainstorming`.

### human-resources — knowledge-work-plugins
- **What:** Recruiting pipeline, interview prep, offers, onboarding, reviews, comp analysis, policy lookup.
- **Use when:** People-ops teams.
- **Install:** `/plugin install human-resources@knowledge-work-plugins`
- **Includes:** skills `recruiting-pipeline`, `interview-prep`, `draft-offer`, `onboarding`, `performance-review`, `comp-analysis`, `org-planning`, `people-report`, `policy-lookup`.

### operations — knowledge-work-plugins
- **What:** Vendor reviews, process docs and optimization, change requests, runbooks, capacity and risk.
- **Use when:** Ops and bizops.
- **Install:** `/plugin install operations@knowledge-work-plugins`
- **Includes:** skills `process-doc`, `process-optimization`, `runbook`, `change-request`, `vendor-review`, `capacity-plan`, `risk-assessment`, `compliance-tracking`, `status-report`.

### engineering — knowledge-work-plugins
- **What:** Standups, code review, architecture/system design, incident response, tech debt, testing strategy, docs.
- **Use when:** Eng managers and on-call engineers (lighter than the dev plugins above).
- **Install:** `/plugin install engineering@knowledge-work-plugins`
- **Includes:** skills `standup`, `code-review`, `architecture`, `system-design`, `incident-response`, `debug`, `tech-debt`, `testing-strategy`, `deploy-checklist`, `documentation`.

### enterprise-search — knowledge-work-plugins
- **What:** One search across email, chat, docs and wikis, with digests and synthesis.
- **Use when:** "Where did we decide X?" across company tools.
- **Install:** `/plugin install enterprise-search@knowledge-work-plugins`
- **Includes:** skills `search`, `digest`, `knowledge-synthesis`, `search-strategy`, `source-management`.

### small-business — knowledge-work-plugins
- **What:** Owner-operator workflows: invoices, bills, payroll prep, cash flow, leads, inventory, marketing, taxes; you approve each step that touches money or customers.
- **Use when:** Running a small business from Claude.
- **Install:** `/plugin install small-business@knowledge-work-plugins`
- **Includes:** 44 skills incl. `monday-brief`, `invoice-chase`, `cash-flow-snapshot`, `payroll-prep`, `lead-finder`, `restock`, `tax-prep`.

### bio-research — knowledge-work-plugins
- **What:** Preclinical research: literature, trials, compounds, single-cell QC, Nextflow, scvi-tools.
- **Use when:** Life-sciences R&D.
- **Install:** `/plugin install bio-research@knowledge-work-plugins`
- **Includes:** skills `start`, `single-cell-rna-qc`, `scvi-tools`, `nextflow-development`, `instrument-data-to-allotrope`, `scientific-problem-selection`; MCP config (PubMed, bioRxiv, ChEMBL, ClinicalTrials.gov, ...).

### brand-voice — knowledge-work-plugins (partner-built)
- **What:** Derives a brand voice from your documents, writes guidelines, and checks AI output against them.
- **Use when:** Keeping generated content on-brand.
- **Install:** `/plugin install brand-voice@knowledge-work-plugins`
- **Includes:** not verified.

### pdf-viewer — knowledge-work-plugins
- **What:** Live PDF viewer to annotate, fill forms, stamp and sign.
- **Use when:** Reviewing or filling PDFs together with Claude.
- **Install:** `/plugin install pdf-viewer@knowledge-work-plugins`
- **Includes:** skill `view-pdf`; MCP server.

### cowork-plugin-management — knowledge-work-plugins
- **What:** Create a plugin from scratch or tailor an existing one to your org's tools.
- **Use when:** Adapting the role plugins above to your stack.
- **Install:** `/plugin install cowork-plugin-management@knowledge-work-plugins`
- **Includes:** skills `create-cowork-plugin`, `cowork-plugin-customizer`.

### Productivity & memory

### productivity — knowledge-work-plugins
- **What:** Task list (TASKS.md), daily planning, and a two-tier memory (CLAUDE.md + memory/) that learns your shorthand.
- **Use when:** Using Claude as a day-to-day work assistant.
- **Install:** `/plugin marketplace add anthropics/knowledge-work-plugins` then `/plugin install productivity@knowledge-work-plugins`
- **Includes:** skills `start`, `task-management`, `memory-management`, `update`; MCP config.

### claude-mem — thedotmack/claude-mem
- **What:** Captures what happens in sessions and injects relevant context into new ones automatically.
- **Use when:** You keep re-explaining the project to each new session.
- **Install:** `/plugin marketplace add thedotmack/claude-mem` then `/plugin install claude-mem@thedotmack`, restart Claude Code (alt: `npx claude-mem install`; plain `npm i -g claude-mem` installs only the library).
- **Includes:** hooks; MCP server; skills incl. `mem-search`, `make-plan`, `handoff`, `learn-codebase`.

### episodic-memory — obra/superpowers-marketplace
- **What:** Semantic search over past Claude Code conversations so decisions carry across sessions.
- **Use when:** "What did we decide last week about X?"
- **Install:** `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install episodic-memory@superpowers-marketplace`
- **Includes:** not verified.

### claude-md-management — official (Anthropic)
- **What:** Audits CLAUDE.md quality and folds session learnings back into it.
- **Use when:** Keeping project memory current.
- **Install:** `/plugin install claude-md-management@claude-plugins-official`
- **Includes:** command `revise-claude-md`; skill `claude-md-improver`.

### notion — official (Notion)
- **What:** Search, create and update Notion pages, databases and tasks.
- **Use when:** Your docs or tasks live in Notion.
- **Install:** `/plugin install notion@claude-plugins-official`
- **Includes:** MCP; commands `search`, `find`, `create-page`, `create-task`, `tasks`, `database-query`, `create-database-row`.

### slack — official (Slack)
- **What:** Search and summarize channels, draft announcements and standups, build Slack apps.
- **Use when:** Pulling team context from Slack or developing for it.
- **Install:** `/plugin install slack@claude-plugins-official`
- **Includes:** MCP; commands `summarize-channel`, `channel-digest`, `find-discussions`, `standup`, `draft-announcement`; skills `slack-search`, `slack-messaging`, `block-kit`, ...

### atlassian — official (Atlassian)
- **What:** Jira and Confluence: triage issues, turn specs into backlog, status reports, sprint dashboards.
- **Use when:** Teams on Jira/Confluence.
- **Install:** `/plugin install atlassian@claude-plugins-official`
- **Includes:** MCP; skills `triage-issue`, `spec-to-backlog`, `generate-status-report`, `jira-sprint-dashboard`, `search-company-knowledge`, `capture-tasks-from-meeting-notes`.

### session-report — official (Anthropic)
- **What:** Explorable HTML report of your local Claude Code usage: tokens, cache efficiency, subagents, priciest prompts.
- **Use when:** Understanding where tokens go.
- **Install:** `/plugin install session-report@claude-plugins-official`
- **Includes:** skill `session-report`.

### receipts — official (Anthropic)
- **What:** Personal impact report of what you shipped and which projects your usage went to.
- **Use when:** Self-reviews or justifying usage.
- **Install:** `/plugin install receipts@claude-plugins-official`
- **Includes:** skill `receipts`.

### project-artifact — official (Anthropic)
- **What:** Publishes a living project status page as a claude.ai artifact from a per-project config.
- **Use when:** Sharing project status with stakeholders.
- **Install:** `/plugin install project-artifact@claude-plugins-official`
- **Includes:** skill `project-artifact`.

### telegram / discord / imessage — official (Anthropic, external_plugins)
- **What:** Channel bridges that let you message a running session from a chat app, with pairing and allowlists.
- **Use when:** Driving Claude Code from your phone.
- **Install:** `/plugin install telegram@claude-plugins-official` (or `discord@...`, `imessage@...`; iMessage is macOS-only)
- **Includes:** MCP server; skills `access`, `configure`.

### Output styles & fun

### explanatory-output-style — official (Anthropic)
- **What:** Adds short insight notes about why code is written the way it is.
- **Use when:** Learning a codebase. (Built-in `Explanatory` style in `/output-style` now does the same.)
- **Install:** `/plugin install explanatory-output-style@claude-plugins-official`
- **Includes:** SessionStart hook.

### learning-output-style — official (Anthropic)
- **What:** Claude pauses at decision points and asks you to write small pieces of code.
- **Use when:** Hands-on practice. (Built-in `Learning` style is equivalent.)
- **Install:** `/plugin install learning-output-style@claude-plugins-official`
- **Includes:** SessionStart hook.

### caveman — JuliusBrussee/caveman
- **What:** Makes the agent answer in terse "caveman" speech and read less, to cut tokens while keeping code exact.
- **Use when:** You want shorter, cheaper answers (or the joke).
- **Install:** `/plugin marketplace add JuliusBrussee/caveman` then `/plugin install caveman@caveman`
- **Includes:** `/caveman` (and `/ultracave`) modes; SessionStart hook auto-activation.

### elements-of-style — obra/superpowers-marketplace
- **What:** Strunk's writing rules for clearer, tighter prose.
- **Use when:** Docs, READMEs, emails.
- **Install:** `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install elements-of-style@superpowers-marketplace`
- **Includes:** not verified.

### double-shot-latte — obra/superpowers-marketplace
- **What:** Stops "Shall I continue?" pauses by having Claude judge whether to keep going.
- **Use when:** Long autonomous runs.
- **Install:** `/plugin install double-shot-latte@superpowers-marketplace` (after adding the marketplace)
- **Includes:** not verified.

### prismantis — NahumLitvin/prismantis (mod)
- **What:** Re-renders Claude's replies (tables, code, diagrams, tool rows) in one of 16 color themes.
- **Use when:** You want richer, themed transcript rendering. Disable it and the stock renderer returns.
- **Install:** `/plugin marketplace add NahumLitvin/prismantis` then `/plugin install prismantis@prismantis`, then `/prismantis setup`
- **Includes:** mod; `/prismantis setup`, `/prismantis theme <name>`, `/prismantis demo`.

### claude-hud — jarrodwatts/claude-hud
- **What:** Status line HUD: context health, tool activity, running agents, todo progress.
- **Use when:** You want to see what Claude is doing at a glance. (More status lines in ui-customization.md.)
- **Install:** `/plugin marketplace add jarrodwatts/claude-hud`, `/plugin install claude-hud@claude-hud`, `/reload-plugins`, `/claude-hud:setup`
- **Includes:** commands `setup`, `configure`.

### claude-tamagotchi — claude-community
- **What:** A pet in your status line that evolves, has moods, and can die of neglect.
- **Use when:** Fun.
- **Install:** `/plugin marketplace add anthropics/claude-plugins-community` then `/plugin install claude-tamagotchi@claude-community`
- **Includes:** not verified.

### agent-ping / claude-sounds — claude-community
- **What:** Play a sound when Claude finishes, asks a question or needs permission (claude-sounds: sounds for 10 event types, bring your own mp3s).
- **Use when:** You step away during long runs.
- **Install:** after adding the community marketplace: `/plugin install agent-ping@claude-community` or `/plugin install claude-sounds@claude-community`
- **Includes:** not verified (hook-based per descriptions).

### math-olympiad — official (Anthropic)
- **What:** Competition-math solving with fresh-context adversarial verifiers.
- **Use when:** Hard proofs (IMO/Putnam style); see also `math-proof`.
- **Install:** `/plugin install math-olympiad@claude-plugins-official`
- **Includes:** skill `math-olympiad`.
