---
name: mantle-doctor
description: Check-up for a Claude Code setup. Finds what quietly costs context every session (skill descriptions, CLAUDE.md, MCP servers), MCP servers that fail to start on Windows (npx without cmd /c), secrets pasted into MCP config, stale paths, duplicate and vague CLAUDE.md rules, rules a hook should enforce, and risky or missing permission rules. Use when the user says Claude is slow, forgets instructions, burns through usage, an MCP server won't connect, asks to audit, clean up or optimize their setup or CLAUDE.md, or wants fewer permission prompts.
license: MIT
---

# Mantle doctor

A read-only check-up, then fixes the user approves one by one.

## Run it

```bash
node scripts/doctor.mjs [projectDir]          # readable report
node scripts/doctor.mjs [projectDir] --json   # for your own processing
```

Paths are relative to this skill's folder; `projectDir` defaults to the current directory. The script never writes anything and never prints secret values.

## How to use the report

1. **Run it** on the user's project and read the whole report before answering.
2. **Lead with the FIX items**, then REVIEW, then a one-line summary of the NOTEs. For each: what it is, why it matters to them (context cost, a server that will not start, a leaked key), and the exact fix.
3. **Offer to apply fixes, never apply silently.** Show the change (the new `claude mcp add` line, the trimmed CLAUDE.md, the permission rules), apply only what the user says yes to, then run the doctor again to confirm.
4. **Measure the real context cost** with `/context` in Claude Code when MCP servers are involved: the script cannot see tool definitions without starting the servers.

## Fixes, by finding

- **MCP npx on Windows:** remove and re-add with the wrapper: `claude mcp remove <name>` then `claude mcp add <name> -- cmd /c npx -y <package>`.
- **Secret in MCP config:** move it to an environment variable, reference it as `${VAR}` in the config, and tell the user to rotate the key if the file was ever committed or shared.
- **Too many MCP servers:** keep the ones this project uses; scope the rest per project (`--scope local`) or remove them. Fewer tools also means better tool choice.
- **Heavy skill descriptions:** disable plugins not needed in this project (`/plugin` → disable) or trim descriptions of the user's own skills to what and when.
- **Long CLAUDE.md:** keep what Claude cannot infer from the code (commands, conventions, gotchas). Move long reference material into a skill or a doc file it reads when needed. Delete duplicates and vague rules ("write clean code").
- **Rule a hook could enforce** ("never commit to main", "always run tests"): offer a permission deny rule or a PreToolUse hook, since prose rules can be forgotten after compaction. Keep the prose line only if it explains why.
- **Stale paths or missing @imports:** update them to the real paths, or remove them.
- **Broad allow rules / bypassPermissions:** replace with the specific commands the user approves every time; suggest auto mode or `/sandbox` for the rest.
- **.env readable:** add `"deny": ["Read(./.env)", "Read(./.env.*)"]` under `permissions` in `.claude/settings.json`.
- **Starter allowlist:** offer the suggested read-only rules for `.claude/settings.json` (shared) or `.claude/settings.local.json` (just them).

Pair with the `mantle-atlas` skill when a fix is "use a different tool" (e.g. a lighter MCP server, or a skill instead of a connector).
