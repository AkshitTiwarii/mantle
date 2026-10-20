# Choosing a mechanism: "I want Claude to …", which feature do I use?

Last verified: 2026-10-21 against https://code.claude.com/docs/en/features-overview (plus the linked feature pages in https://code.claude.com/docs/llms.txt)

For the exact setup of each feature, see `claude-code-features.md`.

## The core distinction: who acts, and when

| Mechanism | Loads or runs | Who decides it fires | Enforced? | Context cost |
|---|---|---|---|---|
| **CLAUDE.md** / `.claude/rules/` | Every session (rules can be path-scoped) | Always on | No, it's guidance | Full text, every request |
| **Output style** | Every response in the session | You switch it | No, it's guidance | Full text, every request |
| **Skill** | Description at start; body when used | Claude (description match) or you (`/name`) | No | Low until used |
| **Slash command** | When typed | You | No | None until used |
| **Subagent** | When spawned, in its own context | Claude or you (`@agent-x`) | Its tool allowlist is enforced | Isolated; only a summary returns |
| **Dynamic workflow** | Script runs many subagents in the background | You opt in (`ultracode`) | Script controls the flow | Only the final result returns |
| **Hook** | On a lifecycle event | Claude Code itself | **Yes**, it's deterministic | Zero unless it prints output |
| **Permission rule / mode** | Every tool call | Claude Code itself | **Yes** | None |
| **MCP server** | Tool names at start; schemas on demand | Claude calls the tools | Server-side auth | Low (tool search) |
| **Mod** | In-process on events and UI renders | Claude Code calls your JS | **Yes** (can rewrite or answer events) | None unless it injects text |
| **Plugin / marketplace** | Packaging only | n/a | n/a | Sum of what's inside |

Three rules of thumb:
1. **Knowledge goes in a prompt, guarantees go in code.** "Never edit `.env`" in CLAUDE.md is a request. A `deny` rule or a `PreToolUse` hook enforces it.
2. **Always needed means CLAUDE.md; sometimes needed means a skill.** Keep CLAUDE.md under about 200 lines and move reference material into skills or path-scoped rules.
3. **Need a clean context? Use a subagent. Need many agents? Use a workflow.** A skill adds to your current context. A subagent works in its own context and returns a summary.

## Head-to-head

- **CLAUDE.md vs skill:** Facts and rules that every session needs go in CLAUDE.md. Procedures, playbooks, and reference docs needed only sometimes go in a skill. A workflow you trigger by name is a skill.
- **Skill vs slash command:** Same `/name` either way. A custom command is a one-file skill. Use the skill folder form when you need supporting files, scripts, or automatic triggering.
- **Skill vs subagent:** A skill is *content* that loads into whatever context is running. A subagent is a *worker* with its own context, tools, and model. They combine: a subagent can preload skills with `skills:`, and a skill can run in a subagent with `context: fork`.
- **Skill vs hook:** If the step needs judgment, use a skill. If it must run identically every time without Claude deciding, use a hook.
- **Hook vs mod:** A hook is a shell, HTTP, MCP, prompt, or agent handler set in a settings file. It can allow, block, or adjust a tool call and add context. A mod is a plugin of JavaScript or TypeScript running *inside* Claude Code. It can draw panes, restyle the UI, add instant commands, rewrite or answer events, and share state between handlers. Use a hook for a script you already have. Use a mod when you need UI or in-process control.
- **MCP vs skill:** MCP *connects* Claude to a system (tools and data). A skill *teaches* Claude how to use it well (schemas, conventions). Use both for the best results.
- **MCP vs hook:** Use MCP when Claude decides to call an external system. Use a hook when an event must always trigger an external call. Hooks can call MCP tools with `"type": "mcp_tool"`.
- **Output style vs CLAUDE.md:** An output style controls how Claude responds (tone, length, role) and you can switch it off. CLAUDE.md holds what's true of the project. They stack.
- **Plugin vs plain `.claude/` files:** Keep files in `.claude/` while they serve one repo. Make a plugin when a second repo or other people need them. Add a marketplace when a team should install the plugin and get updates.
- **Status line vs theme vs mod:** A theme recolors the existing CLI. A status line adds one text row computed by a script. A mod adds or replaces interactive UI. For claude.ai, use a browser extension such as Mantle's; the Claude desktop app has no theming beyond light/dark.

## Need → best mechanism → why

| # | "I want Claude to …" | Best mechanism | Why |
|---|---|---|---|
| 1 | Always run tests or the linter after it edits files | **Hook**: `PostToolUse` with matcher `Edit\|Write` (or `Stop` for a once-per-turn run) | Deterministic, and output is fed back for Claude to fix |
| 2 | Never read `.env` or never push to main | **Permission `deny` rule** (`Read(./.env)`, `Bash(git push *)`), or a `PreToolUse` hook for logic | Enforced by Claude Code, not by the model |
| 3 | Know our build commands and conventions every time | **CLAUDE.md** (`/init` to start) | Loads every session |
| 4 | Follow special rules only in `src/api/` | **`.claude/rules/api.md` with `paths:`** | Loads only when matching files are touched |
| 5 | Learn a repeatable workflow (release, deploy, triage) | **Skill** with `disable-model-invocation: true` if it has side effects | On-demand, invocable as `/name`, can bundle scripts |
| 6 | Use our API style guide when relevant | **Skill** (reference type, model-invocable) | Description triggers it, so there's no constant context cost |
| 7 | Run my usual review prompt with a PR number | **Custom command or skill** with `$ARGUMENTS` | One-liner `/review 123` |
| 8 | Connect to Jira, Slack, GitHub, or a database | **MCP server** (`claude mcp add ...`), or a **claude.ai connector** (claude.ai/customize/connectors) | Gives Claude real tools and auth |
| 9 | Use that Jira connection *our* way | **MCP + skill** | The skill holds field conventions and query patterns |
| 10 | Research the codebase without bloating my chat | **Subagent** (built-in Explore, or a custom one) | Isolated context, returns a summary |
| 11 | Have a reusable reviewer with read-only tools | **Custom subagent** in `.claude/agents/` with `tools: Read, Grep, Glob` | Tool allowlist plus its own prompt and model |
| 12 | Audit or migrate hundreds of files with cross-checking | **Dynamic workflow** (`ultracode: ...`, save with `/workflows` → `s`) | Script-driven fan-out, resumable |
| 13 | Answer shorter, explain more, or act as a writing assistant | **Output style** (`/output-style concise` or a custom style) | Session-wide tone and role |
| 14 | Share our skills, hooks, and agents with the team | **Plugin + marketplace** (`marketplace.json`, `extraKnownMarketplaces` in the repo) | Versioned, namespaced, installable, auto-updatable |
| 15 | Change how Claude looks | CLI: **custom theme** (`~/.claude/themes/*.json`), **status line**, **fullscreen** (`/tui fullscreen`). Panes or restyled UI: **mod**. claude.ai and the terminal together, with wallpapers: **Mantle**; the desktop app can't be themed | Pick by surface and depth of change |
| 16 | Show context %, cost, and branch at all times | **Status line** (`/statusline ...`) | A script with session JSON in, one row out |
| 17 | Show a live panel or add buttons in the CLI | **Mod** | Only mods can draw in the interface |
| 18 | Notify me when it needs input | **Hook**: `Notification` (or `preferredNotifChannel: "terminal_bell"`) | Fires on the exact event |
| 19 | Remember my preferences without me editing files | **Auto memory** ("remember that …") | Claude-maintained notes, per repo |
| 20 | Stop asking permission so much | **Permission mode** (`auto`, or `acceptEdits`) plus **allow rules**, or the **sandbox** in auto-allow mode | Lowers prompts while keeping guardrails |
| 21 | Plan before touching code | **Plan mode** (`Shift+Tab`, `--permission-mode plan`) | No edits until you approve the plan |
| 22 | Run several tasks in parallel locally | **Worktrees** (`claude -w name`) or **background sessions** (`claude --bg`, `claude agents`) | Isolated checkouts, no collisions |
| 23 | Keep working while my laptop is closed | **Cloud session** (`claude --cloud "..."`, claude.ai/code) | Runs on cloud VMs |
| 24 | Do something every night or on each new PR | **Cloud scheduled task** (`/schedule`, claude.ai/code/routines). Needs local files? Use **Desktop scheduled task**. Only during this session? Use **`/loop`** | Pick by where it runs and how long it must persist |
| 25 | Run in CI or a script | **`claude -p`** with `--bare`, `--allowedTools`, `--output-format json` | Non-interactive and reproducible |
| 26 | Embed Claude's agent in my own product | **Agent SDK** (`@anthropic-ai/claude-agent-sdk` / `claude-agent-sdk`) | Library with callbacks, sessions, hooks |
| 27 | Continue my local session from my phone | **Remote Control** (`/remote-control`) | Session stays on my machine |
| 28 | Use a different model or think harder | **`/model`, `/effort`**, the `ultrathink` keyword, or a per-agent `model:` | Pick per session, turn, or worker |

## Quick decision path

1. **Must it happen or be blocked every time, no exceptions?** Use a hook or a permission rule (a mod if it needs UI or must rewrite events).
2. **Does it need an external system?** Use an MCP server or connector, and add a skill for usage conventions.
3. **Is it knowledge?** If every session needs it, use CLAUDE.md or rules. If it's needed sometimes, use a skill.
4. **Is it a procedure you'll repeat?** Use a skill, or a command if it's a one-liner prompt.
5. **Would it flood the context or need parallel workers?** Use a subagent. For dozens of workers or cross-checking, use a workflow.
6. **Is it about tone or format?** Use an output style.
7. **Is it about appearance?** Use a theme, status line, fullscreen, or a mod. For claude.ai and your terminal together, use Mantle; the desktop app can't be themed.
8. **Does it need to reach other repos or people?** Wrap it in a plugin and publish through a marketplace.
9. **Is it about when or where Claude runs?** Use a permission mode, worktree, background session, cloud session, `/loop`, a scheduled task, `claude -p`, or the Agent SDK.
