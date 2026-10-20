# Claude Code customization features: what each one is, when to pick it, and how to set it up

Last verified: 2026-10-21 against https://code.claude.com/docs/llms.txt (official Claude Code docs index and the pages linked below)

Paths use `~` for the home directory (`%USERPROFILE%` on Windows). "Project" means the repo root where you launch `claude`. Version gates are omitted unless they change the advice; check `claude --version` if something documented here is missing.

---

## 1. Instructions and memory

### CLAUDE.md (project instructions)
- **What it is:** Markdown files that load into context at the start of every session as standing instructions. Files at every level stack together (they add up; none replaces another).
- **Use it when:**
  - Claude gets the same convention or command wrong twice ("use pnpm, not npm").
  - You need build/test commands, architecture notes, or "never do X" rules in every session.
  - A repo already has `AGENTS.md`: Claude Code reads it when no CLAUDE.md exists.
- **Not for:** Reference material needed only sometimes (use a **skill**). Rules that must never be broken (use a **hook** or **permission deny rule**, since CLAUDE.md is guidance, not enforcement). Tone or response format (use an **output style**).
- **How:**
  - Locations: `~/.claude/CLAUDE.md` (you, all projects), `./CLAUDE.md` or `./.claude/CLAUDE.md` (team, commit it), `./CLAUDE.local.md` (you, this project; gitignore it). Managed: `/Library/Application Support/ClaudeCode/CLAUDE.md`, `/etc/claude-code/CLAUDE.md`, `C:\Program Files\ClaudeCode\CLAUDE.md`.
  - Files in parent directories load at launch. Files in subdirectories load when Claude touches files there.
  - `/init` generates a starter file. `/memory` lists and opens memory files. `/context` shows which ones loaded.
  - Import other files with `@path/to/file.md` (relative to the importing file, up to 4 hops deep). Wrap a path in backticks to mention it without importing.
  - Keep each file under about 200 lines. `/doctor prompt-audit` audits instruction files.
  - Skip files you don't want with `claudeMdExcludes` (glob list) in settings.
- **Docs:** https://code.claude.com/docs/en/memory

### Path-scoped rules (`.claude/rules/`)
- **What it is:** Modular instruction files. Each loads at launch, or, when it has `paths` frontmatter, only once Claude reads or edits a matching file.
- **Use it when:**
  - CLAUDE.md is growing and topics can be split (`testing.md`, `api-design.md`).
  - Guidance applies only to one language or directory (`src/api/**/*.ts`).
  - You want personal rules in every project: `~/.claude/rules/`.
- **Not for:** Workflows you trigger by name (use a **skill**). Always-on core commands (keep them in **CLAUDE.md**).
- **How:**
  ```markdown
  ---
  paths:
    - "src/api/**/*.ts"
  ---
  # API rules
  - Validate every endpoint's input.
  ```
  Save it as `.claude/rules/api.md`. Subfolders and symlinks work. A symlink that points outside the project asks for approval once.
- **Docs:** https://code.claude.com/docs/en/memory#organize-rules-with-claude/rules/

### Auto memory
- **What it is:** Notes that Claude writes for itself (preferences, corrections, project facts) and reloads in later sessions. Each repo has its own memory, shared by its worktrees.
- **Use it when:**
  - You want Claude to remember corrections without editing files yourself.
  - You say "remember that the API tests need local Redis".
- **Not for:** Team-shared rules (memory is local to your machine, so use **CLAUDE.md**). Anything that must be enforced (use **hooks** or **permissions**).
- **How:**
  - Stored in `~/.claude/projects/<project>/memory/`. The `MEMORY.md` index loads every session (first 200 lines or 25KB), and topic files are read on demand.
  - Turn it on or off with the toggle in `/memory`. That writes `autoMemoryEnabled` to settings. Set `"autoMemoryEnabled": false` in a project's settings to turn it off there, or set the env var `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.
  - Move it with `autoMemoryDirectory`. Subagents can keep their own memory through the `memory:` frontmatter field.
- **Docs:** https://code.claude.com/docs/en/memory#auto-memory

---

## 2. Extending Claude

### Skills
- **What it is:** A folder with a `SKILL.md` (instructions plus YAML frontmatter) and optional supporting files and scripts. Claude loads one automatically when its description matches the task, or you invoke it as `/name`. Only the description stays in context until the skill is used.
- **Use it when:**
  - You paste the same playbook or checklist a third time (deploy, release, review).
  - Claude needs reference material sometimes, not always (API style guide, schema docs).
  - You want a repeatable workflow that bundles scripts (`scripts/helper.py`).
  - You want to teach Claude how to use an MCP server well.
- **Not for:** Facts every session needs (use **CLAUDE.md**). Actions that must happen with no exceptions (use a **hook**). Keeping heavy work out of the main context (use a **subagent**, or `context: fork` in the skill).
- **How:**
  - Locations: `~/.claude/skills/<name>/SKILL.md` (personal), `.claude/skills/<name>/SKILL.md` (project), `<plugin>/skills/<name>/SKILL.md` (invoked as `/plugin:name`). On a name clash, managed beats personal, and personal beats project.
  - Key frontmatter: `name`, `description` (the trigger), `when_to_use`, `disable-model-invocation: true` (only you can invoke it; use this for anything with side effects), `user-invocable: false` (only Claude can invoke it), `allowed-tools`, `context: fork` plus `agent:`, `model`, `effort`, `paths`, `hooks`, `arguments`.
  - Placeholders: `$ARGUMENTS`, `$0`/`$ARGUMENTS[0]`, `${CLAUDE_SKILL_DIR}`. Inject live shell output with `` !`git status` `` at the start of a line.
  ```markdown
  ---
  name: fix-issue
  description: Fix a GitHub issue by number following our standards
  disable-model-invocation: true
  ---
  Fix GitHub issue $ARGUMENTS. Write a test first, then the fix.
  ```
  - Keep `SKILL.md` under 500 lines and link to other files for detail. Hide a skill without editing it with `skillOverrides` in settings.
  - On claude.ai, upload a zipped skill folder under Customize > Skills (support.claude.com/en/articles/12512180).
- **Docs:** https://code.claude.com/docs/en/skills

### Slash commands (built-in and custom)
- **What it is:** Prompts or actions you type as `/name`. Built-ins include `/config`, `/model`, `/mcp`, `/hooks`, `/plugin`, `/permissions`, `/memory`, `/context`, `/agents`, `/statusline`, `/theme`, and `/tui`. Bundled skills such as `/code-review`, `/simplify`, `/loop`, `/debug`, and `/batch` also run as slash commands. Custom commands are now the same thing as skills.
- **Use it when:** You keep typing the same starter prompt. Write it once and give it a `$ARGUMENTS` slot.
- **Not for:** Multi-file workflows with supporting scripts or automatic triggering (use a **skill** folder; it creates the same `/name`).
- **How:**
  - The older form, `.claude/commands/deploy.md` (or `~/.claude/commands/`), still works and accepts the same frontmatter as skills except `name` and `paths`.
  - Subfolders become namespaces: `.claude/commands/frontend/component.md` runs as `/frontend:component`.
  - If a skill and a command share a name, the skill wins. MCP prompts appear as `/mcp__server__prompt`.
- **Docs:** https://code.claude.com/docs/en/skills#commands-and-skills and https://code.claude.com/docs/en/commands

### Subagents
- **What it is:** Specialized workers with their own system prompt, tool allowlist, model, and context window. They do focused work and send only a summary back to the main conversation.
- **Use it when:**
  - A side task would flood the context (searching many files, long logs).
  - You want a reusable specialist (code reviewer, test runner) with restricted tools.
  - You want to run work in parallel, or in an isolated worktree (`isolation: worktree`).
- **Not for:** Knowledge loaded into the current conversation (use a **skill**). Dozens or hundreds of coordinated agents (use a **dynamic workflow**).
- **How:**
  - Files: `.claude/agents/<name>.md` (project) or `~/.claude/agents/<name>.md` (user). For one session, pass `claude --agents '<json>'`. Precedence: managed > `--agents` > project > user > plugin.
  - Frontmatter: `name` and `description` (required), plus `tools`, `disallowedTools`, `model` (`sonnet`/`opus`/`haiku`/`fable`/`inherit`), `permissionMode`, `skills` (preloaded), `mcpServers`, `hooks`, `memory`, `isolation`, `background`, `maxTurns`, `effort`, `color`.
  ```markdown
  ---
  name: code-reviewer
  description: Reviews code for quality and security. Use proactively after code changes.
  tools: Read, Glob, Grep
  model: sonnet
  ---
  You are a senior reviewer. Give specific, actionable feedback.
  ```
  - Invoke one with `@agent-<name>`, by name in plain language, or let Claude delegate. `claude --agent <name>` runs the whole session as that agent. Built-in agents: Explore, Plan, general-purpose.
- **Docs:** https://code.claude.com/docs/en/sub-agents

### Plugins
- **What it is:** An installable bundle of skills, commands, agents, hooks, MCP and LSP servers, output styles, themes, workflows, and mods, described by a `.claude-plugin/plugin.json` manifest. Plugin skills and agents get a name prefix (`/my-plugin:hello`).
- **Use it when:**
  - A second repo needs the same setup.
  - You want to share a tested bundle with a team, or publish versioned releases.
  - You want to install someone else's tooling, such as `commit-commands@claude-plugins-official`.
- **Not for:** A one-off personal tweak in one project (put files under `.claude/` directly).
- **How:**
  ```text
  my-plugin/
  ├── .claude-plugin/plugin.json   {"name":"my-plugin","description":"...","version":"1.0.0"}
  ├── skills/<name>/SKILL.md
  ├── agents/*.md
  ├── hooks/hooks.json             {"hooks": { ...same shape as settings... }}
  └── .mcp.json
  ```
  - Only `plugin.json` goes inside `.claude-plugin/`.
  - Test without installing: `claude --plugin-dir ./my-plugin`, then `/reload-plugins` after edits. Validate with `claude plugin validate ./my-plugin`. `claude plugin init my-tool` scaffolds a plugin that loads in every session.
  - Install: `/plugin install name@marketplace` in a session, or `claude plugin install name@marketplace --scope user|project|local`. Manage plugins in `/plugin` (Discover, Installed, Marketplaces, and Errors tabs).
  - Installs are recorded in `enabledPlugins` in the settings file for the chosen scope.
- **Docs:** https://code.claude.com/docs/en/plugins/create and https://code.claude.com/docs/en/plugins/install

### Plugin marketplaces
- **What it is:** A catalog (`.claude-plugin/marketplace.json`) that lists plugins and where to fetch each one. Users add a marketplace once, then install plugins from it by name and receive updates.
- **Use it when:** A team or organization should install your plugins from a source you control, such as a private git repo.
- **Not for:** Sending a plugin to one or two people (share the directory or a `.zip`). Your own development loop (use `--plugin-dir`).
- **How:**
  ```json
  {
    "name": "my-marketplace",
    "owner": { "name": "Your Team" },
    "plugins": [{ "name": "my-plugin", "source": "./plugins/my-plugin", "description": "..." }]
  }
  ```
  - Source types: relative path, `github`, `git-subdir`, `url`, `archive`, `npm`, `command`.
  - Add a marketplace with `/plugin marketplace add owner/repo` (or a git URL, `./local-dir`, or an `https://.../marketplace.json` URL). From the shell: `claude plugin marketplace add ...`. Validate with `claude plugin validate ./my-marketplace`.
  - Keep each entry's `name` identical to its `plugin.json` name.
  - To make a repo prompt its users for your marketplace, declare it under `extraKnownMarketplaces` in `.claude/settings.json`. It applies once the user trusts the folder.
  - The official marketplace, `claude-plugins-official`, is added automatically.
- **Docs:** https://code.claude.com/docs/en/plugins/create-marketplace

### MCP servers and connectors
- **What it is:** The Model Context Protocol connects Claude to external systems (Jira, Slack, GitHub, databases, browsers) as tools, resources (`@server:proto://path`), and prompts (`/mcp__server__prompt`). Tool search keeps idle tools from using much context.
- **Use it when:**
  - Claude needs live data or actions in a system it can't otherwise reach.
  - You keep copying data from a browser tab into the chat.
  - A team-shared integration should come with the repo (`.mcp.json`).
- **Not for:** Teaching Claude *how* to use a system (pair the server with a **skill**). Deterministic side effects on lifecycle events (use a **hook**, which can also call MCP tools).
- **How:**
  - `claude mcp add --transport http notion https://mcp.notion.com/mcp`
  - `claude mcp add --env KEY=val --transport stdio airtable -- npx -y airtable-mcp-server` (everything after `--` is the server command)
  - Scopes: `--scope local` (default; stored in `~/.claude.json`), `project` (stored in `.mcp.json`, committed), `user` (`~/.claude.json`, all projects).
  - Manage with `claude mcp list|get|remove|add-json`, or `/mcp` inside a session (status, OAuth sign-in, toggles).
  - `.mcp.json` supports `${VAR}` and `${VAR:-default}` expansion.
  - **claude.ai connectors** you add at claude.ai/customize/connectors appear automatically when you're signed in. Turn them off with `"disableClaudeAiConnectors": true`.
  - Tune tool search with `ENABLE_TOOL_SEARCH` (`auto`, `auto:N`, `false`). Org policy is set through `managed-mcp.json`, `allowedMcpServers`, and `deniedMcpServers`.
- **Docs:** https://code.claude.com/docs/en/mcp

### Hooks (settings hooks)
- **What it is:** Handlers that Claude Code itself runs at lifecycle events (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart`, `Stop`, `Notification`, `PreCompact`, `FileChanged`, `ConfigChange`, and more). Hook types: `command`, `http`, `mcp_tool`, `prompt`, and `agent` (experimental). They run deterministically, without Claude choosing to.
- **Use it when:**
  - Something must happen every time: format or lint after each edit, run tests on `Stop`.
  - You need a guardrail: block edits to `.env`, or reject `rm -rf`.
  - You want a notification when Claude needs input, or an audit log of tool calls.
  - You want to add dynamic context at `SessionStart`, or re-add it after compaction.
- **Not for:** Steps that need judgment (use a **skill**). Drawing UI or rewriting events in-process (use a **mod**). Simple allow/deny of tools (**permission rules** are simpler and stricter).
- **How:** Put a `hooks` block in `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, a plugin's `hooks/hooks.json`, or skill or agent frontmatter.
  ```json
  {
    "hooks": {
      "PostToolUse": [
        { "matcher": "Edit|Write",
          "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write" }] }
      ]
    }
  }
  ```
  - The hook receives JSON on stdin. Exit `0` means proceed. Exit `2` blocks the action (for blockable events) and sends stderr back as feedback. You can also print structured JSON (`permissionDecision`, `decision: "block"`).
  - Browse hooks with `/hooks`. Reference scripts as `"$CLAUDE_PROJECT_DIR"/.claude/hooks/x.sh`. Turn all hooks off with `"disableAllHooks": true`.
- **Docs:** https://code.claude.com/docs/en/hooks-guide (full reference: https://code.claude.com/docs/en/hooks)

### Mods (function hooks)
- **What it is:** A plugin whose JavaScript or TypeScript "hooks module" runs *inside* Claude Code. Its handlers can observe, rewrite, or answer events (`tool.call`, `session.start`, `command.run`, `ui.render`, ...) and call the mods API (`$.ui`, `$.command`, `$.state`, ...). Mods can draw panes and the band above the prompt, restyle built-in UI (spinner, tool rows), add instant `/commands`, and hold a tool call to ask the user something. Early access called these "function hooks" (the old `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` env var is now ignored).
- **Use it when:**
  - You want a live pane or band (context gauge, git branch, token chart).
  - You want to rewrite a tool call or prompt, or answer one in Claude Code's place.
  - A `/command` should run code immediately, with no model turn.
  - Hooks need to share state with each other (count calls, then display the count).
- **Not for:** Blocking or logging with a script you already have (use a **settings hook**). Instructions (use a **skill**). External tools (use **MCP**). Mods aren't sandboxed and run with your permissions, so install them only from authors you trust.
- **How:**
  ```text
  first-mod/.claude-plugin/plugin.json
  first-mod/hooks/hooks.json      {"modules": ["./register.js"]}
  first-mod/hooks/register.js     export function register(on) { on('tool.call', async ($, e, next) => next(e)) }
  ```
  - Run with `claude --plugin-dir ./first-mod` (hot-reloads on save). Check it with `claude plugin validate ./first-mod` (lists its hooks and calls) and test it with `claude plugin test`.
  - Or ask Claude: "make a mod that shows the git branch above the prompt" (uses the built-in `/plugin-authoring` skill).
  - Mods work in the CLI, the desktop Code tab, and the VS Code extension. In `claude -p` their hooks run but nothing is drawn.
  - Turn mods off with `--safe-mode` (one session) or `disableAllHooks`.
- **Docs:** https://code.claude.com/docs/en/plugins/mods/overview

### Output styles
- **What it is:** Session-wide instructions that set Claude's role, tone, and response format. Built-in styles: Default, Proactive, Concise, Explanatory, and Learning. You can also write your own.
- **Use it when:**
  - You keep asking for shorter answers, more explanation, or a fixed format.
  - Claude should act as something other than a software engineer (a writing assistant, a data analyst).
- **Not for:** Project facts (use **CLAUDE.md**). Task-specific procedures (use a **skill**). Anything guaranteed (use a **hook**).
- **How:**
  - Switch with `/output-style concise`, through `/config` > Output style, or with `"outputStyle": "Explanatory"` in settings (case-sensitive).
  - Custom styles live in `~/.claude/output-styles/*.md` or `.claude/output-styles/*.md`, with frontmatter `name`, `description`, and `keep-coding-instructions: true` (keeps Claude Code's coding instructions in the system prompt). Plugins can ship styles, and `force-for-plugin` applies one automatically.
  - Restart after editing a style file.
- **Docs:** https://code.claude.com/docs/en/output-styles

### Dynamic workflows
- **What it is:** A JavaScript script that Claude writes and a background runtime executes. It orchestrates many subagents (`agent()`, `pipeline()`, `parallel()`) and returns one result. Runs can be resumed, and you can save one as a `/command`.
- **Use it when:**
  - You need a codebase-wide audit, a migration of hundreds of files, or a fix loop that runs until a check passes.
  - Findings should be cross-checked by independent agents before you see them.
  - You want to re-run the same orchestration later.
- **Not for:** One or two quick delegated tasks (use a **subagent**). Fixed instructions (use a **skill**).
- **How:**
  - Put the word `ultracode` (or "use a workflow") in a prompt, or turn on `/effort ultracode` for the session. The bundled `/deep-research <question>` is one example.
  - Watch and steer runs with `/workflows`. Press `s` to save a run to `.claude/workflows/` or `~/.claude/workflows/`. Plugins can ship a `workflows/` folder.
  - Turn workflows off with `"disableWorkflows": true` or `CLAUDE_CODE_DISABLE_WORKFLOWS=1`. Set the default run size with `workflowSizeGuideline`.
- **Docs:** https://code.claude.com/docs/en/workflows

### Code intelligence (LSP) plugins
- **What it is:** A plugin that connects Claude to a language server. Claude gets go-to-definition, find-references, and type errors after each edit, so it doesn't have to grep.
- **Use it when:** You work in a large or typed codebase where Claude reads many files to locate symbols.
- **Not for:** External services (use **MCP**).
- **How:** Install the code intelligence plugin for your language from `/plugin`. The LSP tool stays inactive until one is installed.
- **Docs:** https://code.claude.com/docs/en/plugins/code-intelligence

---

## 3. Interface

### Themes and custom themes
- **What it is:** The color scheme of the Claude Code CLI. Choose a built-in preset (dark, light, daltonized, ANSI, or auto) or a custom theme that overrides individual color tokens.
- **Use it when:** You want to match your terminal, improve contrast or accessibility, or brand the CLI.
- **Not for:** The terminal emulator's own colors (set those in the terminal app). claude.ai (theme it with a browser extension such as Mantle's) or the Claude desktop app (it has no theming beyond light/dark). Layout or new UI (use a **mod** or the **status line**).
- **How:**
  - Run `/theme`, or pick a theme in `/config`. Choose **New custom theme…** in `/theme` to build one interactively. `Ctrl+E` edits the highlighted theme.
  - A custom theme is a file at `~/.claude/themes/<slug>.json`. Selecting it stores `custom:<slug>`. The file is hot-reloaded on save.
  ```json
  { "name": "Dracula", "base": "dark",
    "overrides": { "claude": "#bd93f9", "error": "#ff5555", "success": "#50fa7b", "promptBorder": "#6272a4" } }
  ```
  - `base` accepts `dark`, `light`, `dark-daltonized`, `light-daltonized`, `dark-ansi`, or `light-ansi`. Colors can be `#rrggbb`, `rgb()`, `ansi256(n)`, or `ansi:<name>`. Tokens include `claude`, `text`, `inactive`, `permission`, `planMode`, `autoAccept`, `diffAdded`, `diffRemoved`, `userMessageBackground`, and others. Plugins can ship themes.
- **Docs:** https://code.claude.com/docs/en/terminal-config#create-a-custom-theme

### Status line
- **What it is:** A row at the bottom of the CLI, filled by any shell command. The command reads session JSON on stdin (model, cwd, git worktree, cost, context window usage, vim mode) and prints what to show.
- **Use it when:** You want context %, cost, git branch, or the model visible at all times, or need to tell parallel sessions apart.
- **Not for:** Interactive panes, buttons, or restyling built-in UI (use a **mod**).
- **How:**
  - Run `/statusline show model and context % with a bar` and Claude writes the script and the setting for you. Or set it by hand:
  ```json
  { "statusLine": { "type": "command", "command": "~/.claude/statusline.sh", "padding": 2, "refreshInterval": 5 } }
  ```
  - Useful input fields: `.model.display_name`, `.workspace.current_dir`, `.context_window.used_percentage`, `.cost.total_cost_usd`.
  - Remove it with `/statusline remove`, or delete the `statusLine` key.
- **Docs:** https://code.claude.com/docs/en/statusline

### Keybindings
- **What it is:** Remappable keyboard shortcuts, grouped by context (`Global`, `Chat`, `Confirmation`, `Scroll`, `Pane`, ...) and named as `namespace:action` (`chat:submit`, `chat:newline`, `app:toggleTodos`).
- **Use it when:** You want to rebind a shortcut, swap Enter and Shift+Enter, add chords (`ctrl+k ctrl+s`), or free a key that clashes with tmux or screen.
- **Not for:** Vim motions (see **Vim mode**). Making the terminal send the right keys (see **Terminal setup**).
- **How:**
  - Run `/keybindings` to create or open `~/.claude/keybindings.json`. Changes apply live.
  ```json
  { "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
    "bindings": [{ "context": "Chat", "bindings": { "ctrl+e": "chat:externalEditor", "ctrl+s": null } }] }
  ```
  - `null` unbinds a key. Ctrl+C, Ctrl+D, Ctrl+M, Ctrl+[, Ctrl+I, and Ctrl+H are reserved.
- **Docs:** https://code.claude.com/docs/en/keybindings

### Fullscreen rendering (TUI)
- **What it is:** An alternate-screen renderer, like vim or htop. It removes flicker, keeps memory flat in long sessions, and adds mouse support (click, select, wheel scroll), a fixed input box, and side panels such as the `/diff` panel and mod panes.
- **Use it when:** The display flickers or scrollback jumps (VS Code terminal, tmux, iTerm2), or you want mouse interaction and side panels.
- **Not for:** People who rely on the terminal's native scrollback and Cmd+F (stay on the classic renderer, or use `Ctrl+o` then `[` to dump the transcript).
- **How:**
  - `/tui fullscreen` switches and saves the `tui` setting. `/tui default` switches back, and `/tui` alone shows the current renderer.
  - Env vars: `CLAUDE_CODE_NO_FLICKER=1` turns fullscreen on. `CLAUDE_CODE_DISABLE_MOUSE=1` keeps native text selection. `CLAUDE_CODE_SCROLL_SPEED=3` (or `/scroll-speed`) adjusts scrolling.
  - In tmux, add `set -g mouse on`.
- **Docs:** https://code.claude.com/docs/en/fullscreen

### Vim mode
- **What it is:** Vim-style NORMAL, INSERT, and VISUAL editing in the prompt box.
- **Use it when:** You want modal editing (`hjkl`, `d`/`c`/`y` with text objects) while you write prompts.
- **Not for:** Remapping app actions (use **keybindings**). Vim motions themselves can't be remapped.
- **How:**
  - Turn it on in `/config` > Editor mode, or with `"editorMode": "vim"` in `~/.claude/settings.json`.
  - Map `jj` to Escape with `vimInsertModeRemaps`. Enter still submits. Use `o` or Ctrl+J for a newline.
- **Docs:** https://code.claude.com/docs/en/terminal-config#edit-prompts-with-vim-keybindings

### Terminal setup
- **What it is:** Fixes that make the terminal send the right signals: Shift+Enter for a newline, Option as Meta on macOS, bells and notifications, and tmux passthrough.
- **Use it when:** Shift+Enter submits instead of adding a newline, Option shortcuts do nothing, no alert appears when Claude finishes, or you run Claude inside tmux.
- **Not for:** Changing what keys do inside Claude Code (use **keybindings**).
- **How:**
  - Run `/terminal-setup` in the host terminal. It configures VS Code, Cursor, Alacritty before 0.16, Zed, and Apple Terminal. Ghostty, Kitty, iTerm2, WezTerm, Warp, and Windows Terminal work without setup.
  - Newline without setup: `Ctrl+J`, or `\` then Enter.
  - Bell: `"preferredNotifChannel": "terminal_bell"`.
  - tmux: add `set -g allow-passthrough on`, `set -s extended-keys on`, and `set -as terminal-features 'xterm*:extkeys'`.
- **Docs:** https://code.claude.com/docs/en/terminal-config

---

## 4. Running Claude

### Permission rules
- **What it is:** Allow, ask, and deny rules that Claude Code enforces, regardless of what the model wants. They are checked in the order deny > ask > allow, and the first match wins.
- **Use it when:**
  - You want fewer prompts for safe commands (`Bash(npm run test *)`).
  - Claude must never do something: deny `Read(./.env)` or `Bash(git push *)`.
  - You need a team-wide policy committed in `.claude/settings.json`.
- **Not for:** Conditional or computed decisions (use a `PreToolUse` **hook**). OS-level limits on what commands can touch (use **sandboxing**).
- **How:**
  ```json
  { "permissions": {
      "allow": ["Bash(npm run lint)", "Bash(npm run test *)", "WebFetch(domain:github.com)"],
      "ask":   ["Bash(git push *)"],
      "deny":  ["Read(./.env)", "Read(./secrets/**)"],
      "additionalDirectories": ["../shared-lib"] } }
  ```
  - Other rule forms: `mcp__server__tool`, `Agent(Explore)`, `Skill(...)`, and `Edit(docs/**)`. Use `Edit` rather than `Write` for path rules.
  - Manage rules with `/permissions`. Per session: `--allowedTools "Read,Edit"` and `--disallowedTools ...`.
- **Docs:** https://code.claude.com/docs/en/permissions

### Permission modes (manual, acceptEdits, plan, auto, dontAsk, bypassPermissions)
- **What it is:** The baseline for which actions run without asking.
  - `default` (shown as Manual): only reads run freely.
  - `acceptEdits`: file edits and common filesystem commands also run freely.
  - `plan`: Claude researches and proposes a plan, with no edits until you approve it.
  - `auto`: a classifier model reviews actions instead of you. This is the default for interactive sessions on recent versions with supported models.
  - `dontAsk`: anything that would prompt is denied. Use it for locked-down CI.
  - `bypassPermissions`: no checks. Use it only in containers or VMs.
- **Use it when:**
  - **Plan**: you want to explore before any change, or agree on an approach first.
  - **Auto**: long hands-off tasks with fewer prompts.
  - **acceptEdits**: you're iterating while reviewing diffs.
  - **dontAsk** or **bypassPermissions**: scripts and CI with an exact allowlist, or an isolated sandbox.
- **Not for:** Fine-grained control of single tools (use **permission rules**, which apply on top of any mode; deny rules block even in bypass).
- **How:**
  - `Shift+Tab` cycles modes during a session.
  - At launch: `claude --permission-mode plan|auto|acceptEdits|dontAsk|default`. `--dangerously-skip-permissions` is bypass.
  - As a default: `"permissions": { "defaultMode": "plan" }`. Project files can't set `auto` or `bypassPermissions`.
  - Admins can turn auto mode off with `permissions.disableAutoMode: "disable"`.
- **Docs:** https://code.claude.com/docs/en/permission-modes

### Sandboxing (Bash sandbox)
- **What it is:** OS-enforced filesystem and network limits around the shell commands Claude runs and the processes they start (Seatbelt on macOS, bubblewrap plus socat on Linux and WSL2; not native Windows). Sandboxed commands can run without prompts.
- **Use it when:** You want fewer Bash prompts without giving up safety, or you need hard limits on writes and outbound hosts.
- **Not for:** Built-in Read, Edit, WebFetch, MCP servers, hooks, or mods, which run outside the sandbox (control them with **permission rules**). Whole-process isolation (use a dev container or VM).
- **How:**
  - Run `/sandbox` and pick a mode, or set `"sandbox": { "enabled": true }`.
  - Tune with `sandbox.filesystem.allowWrite`, `sandbox.network.allowedDomains`, `sandbox.excludedCommands` (runs outside the sandbox), `allowUnsandboxedCommands: false`, and `autoAllowBashIfSandboxed`.
- **Docs:** https://code.claude.com/docs/en/sandboxing

### Worktrees
- **What it is:** Separate git checkouts that share one repo history, so parallel Claude sessions or subagents can edit without colliding.
- **Use it when:** You run several sessions at once (one on a feature, one on a bugfix), or subagents edit files in parallel.
- **Not for:** Splitting work inside one session that doesn't edit the same files (plain **subagents**).
- **How:**
  - `claude --worktree feature-auth` (or `-w`) creates `.claude/worktrees/feature-auth/` on branch `worktree-feature-auth`. `claude -w "#1234"` checks out a PR.
  - Add a `.worktreeinclude` file (gitignore syntax) to copy `.env` and similar files into new worktrees.
  - Subagent frontmatter `isolation: worktree` gives each subagent its own worktree. `worktree.baseRef: "head"` branches from your current HEAD.
  - For non-git version control, use `WorktreeCreate` and `WorktreeRemove` hooks. Add `.claude/worktrees/` to `.gitignore`.
- **Docs:** https://code.claude.com/docs/en/worktrees

### Headless mode (`claude -p`)
- **What it is:** Non-interactive runs for scripts, pipes, and CI, with text, JSON, or streaming output.
- **Use it when:** Running in CI, using Claude as a linter in `package.json`, piping logs in, or extracting structured data.
- **Not for:** Full programmatic control with callbacks in your own app (use the **Agent SDK**).
- **How:**
  ```bash
  claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"
  cat build.log | claude -p "explain the root cause" > out.txt
  claude --bare -p "Summarize README.md" --allowedTools "Read"     # skip hooks/plugins/CLAUDE.md discovery
  claude -p "Extract function names" --output-format json --json-schema '{"type":"object",...}'
  claude -p "Next step" --continue        # or --resume <session_id>
  ```
  - Output formats: `--output-format text|json|stream-json`. Other useful flags: `--append-system-prompt`, `--permission-mode`, `--permission-prompts none`, `--max-budget-usd`.
  - In bare mode, set `ANTHROPIC_API_KEY`, since your subscription login isn't used.
- **Docs:** https://code.claude.com/docs/en/headless

### Agent SDK
- **What it is:** Claude Code's agent loop, tools, permissions, sessions, hooks, subagents, MCP, skills, and plugins, packaged as a TypeScript or Python library you embed in your own app.
- **Use it when:** You're building a product, internal tool, or service around Claude's agent, with approval callbacks, streaming, and structured output.
- **Not for:** Interactive development (use the CLI). Agents that Anthropic hosts for you (use Managed Agents on the Claude Platform).
- **How:**
  - Install: `npm install @anthropic-ai/claude-agent-sdk`, or `pip install claude-agent-sdk` (or `uv add claude-agent-sdk`). Set `ANTHROPIC_API_KEY`.
  ```ts
  import { query } from "@anthropic-ai/claude-agent-sdk";
  for await (const m of query({ prompt: "Fix bugs in utils.py",
    options: { allowedTools: ["Read","Edit","Glob"], permissionMode: "acceptEdits" } })) console.log(m);
  ```
  - Python: `from claude_agent_sdk import query, ClaudeAgentOptions`. Products you ship must not offer claude.ai login.
- **Docs:** https://code.claude.com/docs/en/agent-sdk/overview

### Background sessions and agent view
- **What it is:** Sessions that keep running under a local supervisor with no terminal attached, managed from one list (`claude agents`) grouped by Needs input, Working, and Completed. Each dispatched session works in its own worktree.
- **Use it when:** You want to hand off several tasks at once and check back later, or leave a task running after closing the terminal.
- **Not for:** Work that must survive your machine being off (use **cloud sessions** or **cloud scheduled tasks**).
- **How:**
  - `claude agents` opens the agent view. `claude --bg "task"` starts a session in the background. `claude attach <id|name>` reattaches.
  - Inside a session, `/background` sends it to the background. `←` on an empty prompt does the same and opens agent view.
  - The feature is a research preview.
- **Docs:** https://code.claude.com/docs/en/agent-view

### `/loop` (session-scoped scheduling)
- **What it is:** Re-runs a prompt or skill on an interval, or at an interval Claude picks, inside an open session. Uses the cron tools (`CronCreate`, `CronList`, `CronDelete`).
- **Use it when:** You want to poll a deploy, watch a PR's CI, or set a one-off reminder during the session.
- **Not for:** Anything that must run with the session closed (use **Desktop** or **cloud scheduled tasks**).
- **How:**
  - `/loop 5m check the deploy`, `/loop check CI and fix review comments` (Claude picks the interval), `/loop 20m /review-pr 1234`. Bare `/loop` runs `.claude/loop.md` or the built-in maintenance prompt.
  - Recurring tasks expire after 7 days. Turn the feature off with `CLAUDE_CODE_DISABLE_CRON=1`.
- **Docs:** https://code.claude.com/docs/en/scheduled-tasks

### Cloud scheduled tasks (formerly routines)
- **What it is:** A saved prompt plus repos, environment, and connectors that runs as a cloud session. Triggers: a schedule (minimum interval 1 hour, or one-off), an API POST, or GitHub events (pull requests, releases). Your machine can be off. Available on Pro, Max, Team, and Enterprise.
- **Use it when:** You want nightly backlog triage, PR review on `pull_request.opened`, deploy verification called from CD, or weekly docs-drift checks.
- **Not for:** Work that needs local files or tools (use **Desktop scheduled tasks**). Polling within a session (use **`/loop`**).
- **How:**
  - Create one at claude.ai/code/routines, from the desktop app's Scheduled page, or with `/schedule daily PR review at 9am` in the CLI. `/routines` is an alias.
  - Manage with `/schedule list|update|run`. Runs push to `claude/`-prefixed branches. API triggers need the token shown at creation.
- **Docs:** https://code.claude.com/docs/en/routines

### Desktop scheduled tasks
- **What it is:** Recurring or one-off sessions run by the Claude desktop app on your machine, with full access to local files and tools and a permission mode set per task.
- **Use it when:** A recurring job needs local repos, local MCP config, or tools on your machine (a morning briefing, a dependency audit).
- **Not for:** Jobs that must run while your computer sleeps or is off (use **cloud scheduled tasks**).
- **How:**
  - In the desktop app: Code tab > **Scheduled** > **New task** > turn on **Only on this computer** > pick a folder, a schedule preset, the permission mode, and the model. Or ask in any session: "set up a daily code review at 9am".
  - Prompts are stored at `~/.claude/scheduled-tasks/<task>/SKILL.md`.
  - Runs need the app open and the computer awake, and missed runs catch up once.
- **Docs:** https://code.claude.com/docs/en/desktop-scheduled-tasks

### Cloud sessions (Claude Code on the web)
- **What it is:** Claude Code running on Anthropic-managed VMs (or your org's self-hosted environment) against a fresh clone of your GitHub repo. You can steer it from the browser, phone, desktop app, or terminal.
- **Use it when:** You want long tasks that keep going with your laptop closed, many parallel tasks, or auto-fixing a PR's CI failures and review comments.
- **Not for:** Work that needs uncommitted local state or local-only MCP servers (use a local session plus **Remote Control**).
- **How:**
  - Start at claude.ai/code, or with `claude --cloud "Fix the flaky test"`. Pull a session back to your terminal with `claude --teleport [id]` or `/teleport`.
  - Message a running session: `claude -p "msg" --cloud <session-id>`. Run `/autofix-pr` on a PR branch. Connect GitHub from the terminal with `/web-setup`.
  - Only the committed `.claude/settings.json`, CLAUDE.md, skills, and agents carry over.
- **Docs:** https://code.claude.com/docs/en/claude-code-on-the-web

### Remote Control
- **What it is:** Lets claude.ai/code or the Claude mobile app drive a session that keeps running on *your* machine, with your files, MCP servers, and config.
- **Use it when:** You start at your desk and continue from your phone, or approve prompts away from the keyboard.
- **Not for:** Work that should continue with your machine off (use **cloud sessions**).
- **How:**
  - `claude remote-control` runs server mode. `claude --remote-control "My Project"` (or `--rc`) starts an interactive session with remote access. Inside a session, `/remote-control` (or `/rc`) connects it.
  - Requires a claude.ai login on Pro, Max, Team, or Enterprise. Team and Enterprise need an admin toggle.
- **Docs:** https://code.claude.com/docs/en/remote-control

### IDE integrations (VS Code, Cursor, JetBrains)
- **What it is:** Claude inside your editor, with inline diffs, selection context, @-mentions with line ranges, plan review, and IDE diagnostics.
- **Use it when:** You want graphical diff review and editor context without switching windows.
- **Not for:** Headless automation (use **`claude -p`**).
- **How:**
  - **VS Code or Cursor:** install the extension `anthropic.claude-code` (search "Claude Code"). Open it from the Spark icon. `Cmd/Ctrl+Esc` toggles focus, and `Option/Alt+K` inserts an @-mention. The extension bundles its own CLI and reads the same settings files.
  - **JetBrains:** install the "Claude Code [Beta]" plugin from the JetBrains Marketplace, plus the CLI. Run `claude` in the IDE terminal, or `/ide` from an external terminal. Set the Diff tool in `/config`.
- **Docs:** https://code.claude.com/docs/en/vs-code and https://code.claude.com/docs/en/jetbrains

### Desktop app (Code tab)
- **What it is:** The Claude desktop app's Code tab runs local, SSH, or cloud Claude Code sessions with a GUI. It has parallel sessions on worktrees, a diff view with line comments, a browser preview pane, a terminal, plugins and connectors, PR monitoring, and scheduled tasks. Available on macOS, Windows, and Linux (beta).
- **Use it when:** You prefer a GUI for managing parallel sessions and reviewing diffs, or you want the built-in app preview.
- **Not for:** Scripting (use the CLI or the **Agent SDK**). Some terminal-only commands, such as the `/config` menu, aren't available there (edit settings files instead).
- **How:** Download the app, sign in, and open the **Code** tab. It reads the same `~/.claude` and `.claude/` settings files as the CLI. Install plugins from **+** > **Add plugins**.
- **Docs:** https://code.claude.com/docs/en/desktop

---

## 5. Configuration

### Settings files and precedence
- **What it is:** JSON configuration for permissions, hooks, env, model, theme, plugins, sandbox, status line, and more, read from several scopes.
- **Use it when:** You need any persistent configuration. Pick the scope by who it should affect.
- **Not for:** Natural-language instructions (use **CLAUDE.md**).
- **How:**
  - Files: `~/.claude/settings.json` (you, all projects), `.claude/settings.json` (team, commit it), `.claude/settings.local.json` (you, this project; auto-gitignored), and managed settings (`managed-settings.json`, MDM, or server-managed).
  - Precedence, highest first: **managed > `--settings` (command line) > local > project > user**. Arrays such as `permissions.allow` merge across files instead of overriding.
  - Add `"$schema": "https://json.schemastore.org/claude-code-settings.json"` for editor autocomplete.
  - Use `/config` for a menu (or `/config key=value`) and `/status` to see which sources loaded. `claude doctor` reports rejected entries. `~/.claude.json` holds app state and local- or user-scoped MCP servers.
- **Docs:** https://code.claude.com/docs/en/settings (every key: https://code.claude.com/docs/en/settings-reference)

### Environment variables
- **What it is:** Process-level switches for auth, provider, model, timeouts, telemetry, and feature toggles.
- **Use it when:** Selecting a provider or gateway, raising timeouts, or turning features off in CI.
- **Not for:** Values that already have a dedicated settings key (prefer the key; check which one wins in the docs).
- **How:**
  - Set them in the shell (`export API_TIMEOUT_MS=1200000`), or persistently in an `"env": { ... }` block in settings. Values in `env` aren't expanded, so use absolute paths.
  - Common ones: `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_EFFORT_LEVEL`, `MAX_THINKING_TOKENS`, `BASH_DEFAULT_TIMEOUT_MS`, `DISABLE_TELEMETRY`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `ENABLE_TOOL_SEARCH`.
- **Docs:** https://code.claude.com/docs/en/env-vars

### Model and effort configuration
- **What it is:** Which model a session uses and how hard it thinks.
  - Model aliases: `sonnet`, `opus`, `haiku`, `fable`, `opusplan` (Opus while planning, Sonnet while executing), and `sonnet[1m]`/`opus[1m]` for a 1M-token context. Use a full model ID to pin a version.
  - Effort levels: `low`, `medium`, `high`, `xhigh`, `max`.
- **Use it when:** You want to trade speed and cost against capability, or set a team default model.
- **Not for:** Per-subagent or per-skill choices (set `model:` and `effort:` in their frontmatter instead).
- **How:**
  - Model, highest priority first: `/model <alias>`, then `claude --model opus`, then `ANTHROPIC_MODEL`, then `"model"` in settings.
  - Effort: `/effort <level>` (slider with no argument), `claude --effort high`, `CLAUDE_CODE_EFFORT_LEVEL`, or `"effortLevel"` in settings. Put `ultrathink` in a prompt for one deeper turn. `/fast` toggles fast mode.
  - Admins restrict models with `availableModels` and `deniedModels`.
- **Docs:** https://code.claude.com/docs/en/model-config
