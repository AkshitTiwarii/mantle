---
name: mantle-atlas
description: Knowledge base of the Claude ecosystem — every public Agent Skill on skills.sh (~30k), every connector in the official MCP Registry (~17k), the official plugin marketplaces, every Claude Code feature, and UI customization (themes, status lines, wallpapers). Use when the user asks "is there a skill/tool/connector/plugin for X", "how do I make Claude do X", "what's the best way to extend/customize/automate Claude", wants to compare options, set up a workflow, connect an app (Jira, Slack, GitHub, Stripe...), change how Claude looks, or when you yourself need a capability you don't have and should check whether one exists before building it.
license: MIT
---

# Mantle Atlas

A map of what already exists for Claude, so you recommend the right existing tool — with what it is, when it fits, and how to install it — instead of guessing or rebuilding it.

## Where the knowledge lives

Read only what the question needs (the index files are large; search them, don't open them whole).

| Need | Read |
| --- | --- |
| Which mechanism fits (skill vs MCP vs plugin vs hook vs subagent vs CLAUDE.md...) | `references/choosing.md` |
| A Claude Code feature: what, when, how | `references/claude-code-features.md` |
| Best skills for a job, curated | `references/skills-by-job.md` |
| Best connectors (MCP) for a job, curated | `references/connectors-by-job.md` |
| Plugins and marketplaces | `references/plugins-and-marketplaces.md` |
| Making Claude look different (themes, status lines, terminal, claude.ai, wallpapers) | `references/ui-customization.md` |
| Anything else: the full index | `node scripts/search.mjs "<need>"` over `data/skills.tsv`, `data/connectors.tsv`, `data/plugins.tsv` |

Paths are relative to this skill's folder.

## How to answer

1. **Name the job.** Restate what the user is trying to get done in one line. If the right *mechanism* is unclear, check `references/choosing.md` first.
2. **Check the curated guide** for that area. Curated entries carry "use when / skip when" judgment; prefer them.
3. **Search the index** when the guide has no fit or the user wants more options:
   `node scripts/search.mjs "<specific words>" --type skills|connectors|plugins --limit 10`
   Search with the most specific words you have (a product name like `jira` or `supabase` beats `tickets` or `database`); run two or three phrasings if the first is thin. Add `--live` to ask skills.sh and the MCP Registry right now (needs network). If Node isn't available, `grep -i` the TSV files.
4. **Read before recommending** an index-only result: open its SKILL.md / README (the `url`/`repo` column) to confirm what it does. Index descriptions are the author's own claims.
5. **Recommend 1–3 options**, best first, each as:
   - **Name** (source) — what it does in one line
   - **Use it when** … / **skip it when** …
   - **Install:** the exact command, and where to run it (Claude Code prompt vs system terminal)
   - **Then:** how to invoke or use it once installed
6. **Say what's unknown**: popularity (installs) is not quality; third-party skills and MCP servers run with the user's permissions — point out anything that needs API keys, broad file or network access, and suggest reviewing the source. skills.sh shows security audits on each skill page.

Never install, enable, or configure anything yourself unless the user asks you to; give them the commands.

## Keeping it current

The index was built by `node scripts/refresh.mjs` (date in `data/REFRESHED`). If it is more than a few weeks old or a known tool is missing, say so and offer to run the refresh (≈5–10 minutes, public APIs only). Use `--live` search for anything announced recently.

## Remembering it across sessions (opt-in)

Skills load on demand, so Atlas is available whenever a question calls for it. If the user explicitly asks you to make Claude *always* aware of it, offer to append this to their `~/.claude/CLAUDE.md` (show it first, write only on their yes):

```markdown
## Tools & extensions
Before building a capability or answering "is there a tool for X", consult the mantle-atlas skill
(skills, MCP connectors, plugins, Claude Code features, UI customization).
```

## Scope and sources

Sources: skills.sh (sitemaps + public search API) and each skill's SKILL.md on GitHub; the official MCP Registry (registry.modelcontextprotocol.io); Anthropic's official plugin marketplaces; code.claude.com docs. No data from social networks. Works in any agent that reads Agent Skills (Claude Code, Claude apps, Cursor, Codex, Copilot...); install commands in the guides are for Claude Code unless noted.
