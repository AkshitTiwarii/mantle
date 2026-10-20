# Customizing how Claude looks and feels

Purpose: tell an agent every supported (and a few unsupported) way to change Claude's appearance and feel across Claude Code, the terminal it runs in, claude.ai and the desktop app, with exact steps.

Collected 2026-10-21. Sources: code.claude.com/docs/en (terminal-config, settings-reference, statusline, output-styles, keybindings, fullscreen, plugins/components, plugins/mods/overview), support.claude.com (appearance settings), ghostty.org config reference, READMEs of ccstatusline, claude-powerline, claude-hud, starship-claude, tweakcc, prismantis, and AkshitTiwarii/mantle.

## What can be themed, at a glance

| Surface | Colors | Background / wallpaper | Font | How |
| --- | --- | --- | --- | --- |
| Claude Code (terminal CLI) | Yes: every UI token | Comes from the terminal | Comes from the terminal | `/theme`, `~/.claude/themes/*.json`, plugin themes, mods |
| Terminal app (Windows Terminal, iTerm2, Ghostty, WezTerm, ...) | Yes: color scheme | Yes (image, opacity, acrylic/blur) | Yes | Terminal's own settings |
| claude.ai (browser) | Light / Dark / System only | No | Default / System / Dyslexic Friendly | Settings → Appearance; anything more needs a browser extension |
| Claude desktop app | No custom theming | No | No | Not themeable: the app bundle is integrity-checked, so patching or injecting CSS isn't viable. Mods do run in its Code tab (panes, commands) |

---

## 1. Claude Code built-in themes (`/theme`)

### Built-in presets
- **What:** Seven presets: `auto` (follows your terminal's light/dark background), `dark` (default), `light`, `dark-daltonized`, `light-daltonized` (colorblind-friendly), `dark-ansi`, `light-ansi` (use only the terminal's 16 ANSI colors).
- **Use when:** Quick match to your terminal. Pick an `-ansi` preset if you want Claude Code to inherit whatever color scheme your terminal uses.
- **How:** Run `/theme` (or `/config` → Theme). Or set `"theme": "dark-ansi"` in `~/.claude/settings.json`.

### Custom theme JSON
- **What:** Your own palette layered over a base preset, stored as `~/.claude/themes/<slug>.json`. Claude Code watches the folder and hot-reloads on save (restart once if the folder didn't exist when it started).
- **Use when:** You want specific brand or editor colors.
- **How:** `/theme` → **New custom theme…** (pick tokens with live preview; Ctrl+E edits the highlighted custom theme), or write the file:

```json
{
  "name": "Midnight",
  "base": "dark",
  "overrides": {
    "claude": "#a78bfa",
    "promptBorder": "#a78bfa",
    "planMode": "#38bdf8",
    "diffAdded": "#14532d",
    "diffRemoved": "#7f1d1d",
    "userMessageBackground": "#1e1b4b"
  }
}
```

  Selecting it stores `"theme": "custom:<slug>"` (plugin themes: `custom:<plugin>:<slug>`). `base` is one of the presets above except `auto`. Colors accept `#rrggbb`, `#rgb`, `rgb(r,g,b)`, `ansi256(n)`, `ansi:<name>` (e.g. `ansi:cyanBright`). Unknown tokens and bad values are ignored.

**Token reference** (set any subset under `overrides`):

| Group | Tokens |
| --- | --- |
| Text & accent | `claude` (spinner, assistant label), `text`, `inverseText`, `inactive`, `subtle`, `suggestion`, `permission`, `remember` |
| Status | `success`, `error`, `warning`, `merged` |
| Input & modes | `promptBorder`, `planMode`, `autoAccept`, `bashBorder`, `ide`, `fastMode`, `effortUltra` |
| Diffs | `diffAdded`, `diffRemoved`, `diffAddedDimmed`, `diffRemovedDimmed`, `diffAddedWord`, `diffRemovedWord` |
| Transcript backgrounds | `userMessageBackground`, `bashMessageBackgroundColor`, `memoryBackgroundColor`; fullscreen-only: `userMessageBackgroundHover`, `selectionBg`, `composerSidebarBackground` |
| Usage meter & labels | `rate_limit_fill`, `rate_limit_empty`, `briefLabelYou`, `briefLabelClaude` |
| Shimmer pairs | `claudeShimmer`, `warningShimmer`, `permissionShimmer`, `promptBorderShimmer`, `inactiveShimmer`, `fastModeShimmer` (override with their base token) |
| Subagent colors | `<color>_FOR_SUBAGENTS_ONLY` for red, blue, green, yellow, purple, orange, pink, cyan |
| `ultrathink` rainbow | `rainbow_<color>` and `rainbow_<color>_shimmer` for red, orange, yellow, green, blue, indigo, violet |

### Plugin-shipped themes
- **What:** Any plugin can ship `themes/<slug>.json` (same format); they appear in `/theme` under their `name`. They're read-only: editing one in `/theme` saves a copy to your own themes folder.
- **Use when:** You want a ready-made palette or a theme bundle (Mantle ships ten).
- **How:** Install the plugin (see plugins-and-marketplaces.md), then pick the theme in `/theme`.

---

## 2. Mantle (one theme across Claude Code, Windows Terminal and claude.ai)

### mantle — AkshitTiwarii/mantle
- **What:** A Claude Code plugin (a mod with a studio pane) that applies one theme everywhere: Claude Code's full token set via a native theme file, a matching Windows Terminal profile ("Claude · Mantle": scheme, wallpaper, opacity, acrylic, font), and claude.ai through a bundled Chrome extension (page colors, blurred wallpaper behind frosted panels, a glow while Claude replies). Each surface can also get its own preset, accent, wallpaper or opacity.
- **Live state colors:** the Claude Code theme shifts with what Claude is doing: idle = accent, thinking = second accent, running a tool = info color, plan mode = warning, finished = success for 2.5 s, error/refusal = error for 5 s. On claude.ai a light sweeps across the top and the accent shifts while a reply streams.
- **Presets:** Ember, Aurora, Synthwave, Tokyo Night, Catppuccin Mocha, Rosé Pine, Nord Night, Forest, Deep Ocean, Paper (light). All ten also show in `/theme` as standalone themes.
- **Use when:** You want Claude to look the same in the terminal and the browser, with a wallpaper, and visibly react to its state.
- **Install:**
  - In a Claude Code terminal session: `/plugin install mantle --marketplace AkshitTiwarii/mantle`
  - From a shell: `claude plugin install mantle --marketplace AkshitTiwarii/mantle`
  - Desktop app (no `/plugin` there): **+** next to the prompt box → **Plugins** → **Add marketplace** `AkshitTiwarii/mantle` → **Add plugin**.
  - claude.ai extension: run `/mantle apply` once (writes the extension to `~/.claude/mantle/chrome-extension`), then in Chrome open `chrome://extensions`, turn on Developer mode, **Load unpacked**, choose that folder.
- **Commands:**

| Command | Effect |
| --- | --- |
| `/mantle` | Open the studio pane: presets, per-surface tabs (Claude Code, Terminal, claude.ai), **Apply everywhere** |
| `/mantle <preset>` | Switch preset and apply everywhere, e.g. `/mantle synthwave` |
| `/mantle apply` | Re-apply current settings to every enabled surface |
| `/mantle live on` / `/mantle live off` | Turn live state colors on or off |
| `/mantle wallpaper <url\|file\|off>` | Set or clear the wallpaper from the prompt (Mantle 0.2.0+): an https image is downloaded for Windows Terminal and used directly on claude.ai; a local file is used for both; `off` clears it. The studio pane's Terminal and claude.ai tabs set it per surface. |

- **How it works / where files go:** writes `~/.claude/themes/mantle.json` (live reactions rewrite this one file; first apply switches Claude Code to the **Mantle (live)** theme, or pick it in `/theme`). Windows Terminal gets a settings fragment at `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\Mantle\mantle.json`; your own `settings.json` is never edited (open a new window if the profile doesn't appear). The extension overrides claude.ai's `--cds-*` CSS color tokens. No network calls.
- **Limits:** desktop app can't be themed (integrity-checked bundle); claude.ai theming depends on the site's CSS token names and may need an update after a redesign; local wallpaper files must be under 3 MB for claude.ai (use an https URL for bigger images); the terminal part targets Windows Terminal.

---

## 3. Status lines

The status line is a row under the prompt rendered by any command you configure. Claude Code pipes session JSON (model, cwd, git, context window %, cost, rate limits, cache stats, vim mode, ...) to its stdin and shows what it prints. With a custom status line, most footer hints (e.g. "esc to interrupt") are hidden.

### Built-in `/statusline`
- **What:** Claude writes the script for you from a description and wires it into settings.
- **Use when:** You want something custom without learning the JSON schema.
- **How:** `/statusline show model name and context percentage with a progress bar`. Manual form in `~/.claude/settings.json`:

```json
{ "statusLine": { "type": "command", "command": "~/.claude/statusline.sh", "padding": 2, "refreshInterval": 5 } }
```

  `refreshInterval` (seconds, min 1) keeps timers ticking while idle; `hideVimModeIndicator` hides the built-in vim badge. Plugins can set a `subagentStatusLine` default. To disable, remove `statusLine`.

### ccstatusline — sirmalloc/ccstatusline
- **What:** Interactive TUI to build a widget-based status line (model, git, tokens, context, cost, rate limits), with Powerline mode, gradients and multi-line layouts.
- **Use when:** You want a rich, configurable bar without writing code. Docs cite it as a community option.
- **How:** run `npx -y ccstatusline@latest` (or `bunx -y ccstatusline@latest`) in a shell, configure, then install from the TUI; it writes `"statusLine": {"type": "command", "command": "npx -y ccstatusline@latest"}`.

### claude-powerline — Owloops/claude-powerline
- **What:** Vim-style powerline bar with usage/budget tracking and git, 6 themes (dark, light, nord, tokyo-night, rose-pine, gruvbox) or custom.
- **Use when:** You like powerline aesthetics and want it to match your terminal theme.
- **How:** `/plugin marketplace add Owloops/claude-powerline`, `/plugin install claude-powerline@claude-powerline`, then `/powerline` (wizard writes `~/.claude/claude-powerline.json` and updates settings). Manual: `"command": "npx -y @owloops/claude-powerline@latest --style=powerline"`. Visual configurator: powerline.owloops.com. Needs a Nerd Font (or `--charset=text`).

### claude-hud — jarrodwatts/claude-hud
- **What:** HUD status line showing context health, tool activity, running agents and todo progress.
- **Use when:** You want to watch what Claude is doing.
- **How:** `/plugin marketplace add jarrodwatts/claude-hud`, `/plugin install claude-hud@claude-hud`, `/reload-plugins`, `/claude-hud:setup`; tweak with `/claude-hud:configure`. On Windows it needs Node.js.

### starship-claude — martinemde/starship-claude
- **What:** Renders the status line with Starship, reusing your prompt styling. Linked from the official docs.
- **Use when:** You already use Starship in your shell.
- **How:** `/plugin marketplace add martinemde/starship-claude`, `/plugin install starship-claude@starship-claude` (see README for the `statusLine` command it uses).

### Playful status lines
- **What:** `claude-tamagotchi` (a pet that evolves and can die of neglect) and `jelly-pet` (tokens feed a pet), both in the community marketplace. awesome-claude-code's "Status Lines" section lists more (kaomoji faces, usage bars).
- **How:** `/plugin marketplace add anthropics/claude-plugins-community`, then `/plugin install claude-tamagotchi@claude-community` or `/plugin install jelly-pet@claude-community`.

---

## 4. Output styles (how Claude writes)

### Built-in styles
- **What:** Default, **Proactive** (acts on routine decisions without asking), **Concise** (leads with the result, no narration), **Explanatory** (adds "Insight" notes), **Learning** (leaves small pieces of code for you to write).
- **Use when:** You want a different tone or verbosity for a whole session.
- **How:** `/output-style concise` (no argument lists styles), or `/config` → Output style, or `"outputStyle": "Concise"` in settings (value is case-sensitive). Desktop app: set `outputStyle` in a settings file.

### Custom output styles
- **What:** A Markdown file with frontmatter (`name`, `description`, optional `keep-coding-instructions: true`) and the instructions.
- **Use when:** Turning Claude into a writing partner, analyst, or giving it house style.
- **How:** save to `~/.claude/output-styles/<name>.md` (user) or `.claude/output-styles/` (project); plugins ship them in `output-styles/` and they appear as `<plugin>:<name>`.

---

## 5. Spinner, tips, motion and layout (native settings)

All in `~/.claude/settings.json` (or project settings):

| Setting | Effect |
| --- | --- |
| `"spinnerVerbs": {"mode": "append" \| "replace", "verbs": ["Pondering", "Crafting"]}` | Add to or replace the rotating "Accomplishing…/Baking…" verbs |
| `"spinnerTipsEnabled": false` | Hide the one-line tips under the spinner |
| `"spinnerTipsOverride": {"label": "Team tip", "tips": [...], "excludeDefault": true}` | Your own tips (strings or objects with `id`, `text`, `cooldownSessions`, `priority`), or a `tipsFile` |
| `"prefersReducedMotion": true` | Tone down spinner, shimmer and flash animations |
| `"maxProseWidth": 80` | Wrap prose at N columns in wide terminals |
| `"editorMode": "vim"` | Vim editing in the prompt (also `/config` → Editor mode); `vimInsertModeRemaps` maps e.g. `jj` to Escape |
| `"preferredNotifChannel": "terminal_bell"` | Ring the bell when Claude finishes (desktop notifications are automatic in Ghostty, Kitty, iTerm2) |
| `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` (env) | Stop Claude Code from setting the terminal title / OSC 7501 session status |

### Mods that restyle the interface
- **What:** Mods (JS/TS plugins that run inside Claude Code) can draw panes and bands above the prompt and redraw parts Claude Code draws itself: the spinner, tool-call rows, the question dialog. Mantle and prismantis are mods.
- **Use when:** A setting doesn't go far enough and you want a real UI change that survives updates.
- **How:** install a mod plugin like any plugin. Example: prismantis themes Claude's replies (16 themes): `/plugin marketplace add NahumLitvin/prismantis`, `/plugin install prismantis@prismantis`, `/prismantis setup`, `/prismantis theme <name>`. To write your own, see code.claude.com/docs/en/plugins/mods/overview.

### tweakcc — Piebald-AI/tweakcc (unofficial, patches the CLI)
- **What:** A TUI that patches Claude Code's installed `cli.js` (or extracts, patches and repacks the native binary) to change system prompts, themes with an HSL/RGB picker, thinking verbs and "Claude is <verb>ing" format, spinner animations, the startup banner, and more. Settings live in `~/.tweakcc/config.json`.
- **Use when:** You want changes the official settings can't make and accept the risk. Prefer native `spinnerVerbs`, custom themes and mods first.
- **How:** `npx tweakcc` (interactive), `npx tweakcc --apply` to re-apply after every Claude Code update (updates overwrite the patch). Caveats: unsupported by Anthropic; patches are verified against a specific Claude Code version (2.1.162 per its README) and may fail on others; it modifies the installed program.

---

## 6. Rendering mode and keybindings

### Fullscreen (flicker-free) rendering
- **What:** Draws Claude Code on the alternate screen like vim/htop: no flicker, flat memory in long chats, mouse support, a diff panel. Research preview. Not related to maximizing the window.
- **Use when:** The display flickers or scroll jumps (common in VS Code's terminal, tmux, iTerm2).
- **How:** `/tui fullscreen` (saved; relaunches with the conversation intact), `/tui default` to go back, `/tui` to see which is active. Or set env `CLAUDE_CODE_NO_FLICKER=1`. Scroll inside Claude Code with mouse/PageUp. Theme tokens `selectionBg`, `userMessageBackgroundHover`, `composerSidebarBackground` apply only here.

### Keybindings
- **What:** Remap or unbind Claude Code shortcuts per context.
- **Use when:** Shortcut conflicts, or you want Enter for newline and Shift+Enter to submit.
- **How:** `/keybindings` opens `~/.claude/keybindings.json` (hot-reloaded):

```json
{
  "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
  "bindings": [
    { "context": "Chat", "bindings": { "ctrl+e": "chat:externalEditor", "ctrl+s": null } }
  ]
}
```

  Newline: Ctrl+J or `\` then Enter always work; Shift+Enter works natively in Ghostty, Kitty, iTerm2, WezTerm, Warp, Apple Terminal and Windows Terminal; run `/terminal-setup` once in VS Code, Cursor, Zed and older Alacritty. Rebind via `chat:newline` / `chat:submit`. On macOS enable "Option as Meta" for Option shortcuts.

---

## 7. Terminal setup (colors, wallpaper, transparency, fonts)

Claude Code never changes the terminal's own palette, background or font: set those in the terminal. Pair a terminal color scheme with a matching Claude Code theme, or use `dark-ansi`/`light-ansi` so Claude Code follows the terminal palette automatically. Powerline-style status lines need a Nerd Font.

### Windows Terminal
- **What:** Per-profile color scheme, background image, transparency and acrylic blur, font.
- **Use when:** Windows users.
- **How:** Settings UI → profile → Appearance, or in `settings.json` under the profile: `"colorScheme"`, `"backgroundImage"`, `"backgroundImageOpacity"`, `"backgroundImageStretchMode"`, `"opacity"`, `"useAcrylic": true`, `"font": {"face": "Cascadia Code"}`; schemes go in the top-level `"schemes"` array. Apps can add profiles without touching your file via fragments in `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\<app>\` (Mantle does this).

### iTerm2 (macOS)
- **What:** Color presets, transparency, blur, background image per profile.
- **How:** Settings → Profiles → Colors → Color Presets… → Import (`.itermcolors`); Profiles → Window → Transparency, Blur, Background Image; Profiles → Text → Font. For Option shortcuts: Profiles → Keys → Left/Right Option = "Esc+".

### Ghostty
- **What:** Hundreds of built-in themes, opacity, blur, and (1.2.0+) a background image.
- **How:** in the config file: `theme = <name>` (list with `ghostty +list-themes`), `background-opacity = 0.9`, `background-blur = true`, `background-image = /path/to/img.png`, `background-image-opacity = 0.3`, `font-family = "JetBrainsMono Nerd Font"`. The community plugin `ghostty-dynamic-themes` switches Ghostty themes from inside Claude Code (`/plugin install ghostty-dynamic-themes@claude-community`).

### WezTerm
- **What:** Lua config with built-in schemes, background images and OS-level blur/acrylic.
- **How:** in `wezterm.lua`: `config.color_scheme = 'Tokyo Night'`, `config.window_background_image = '/path/img.png'`, `config.window_background_opacity = 0.85`, `config.win32_system_backdrop = 'Acrylic'` (Windows), `config.macos_window_background_blur = 20` (macOS), `config.font = wezterm.font 'JetBrains Mono'`.

### tmux
- **What:** Needed so notifications, progress and Shift+Enter pass through.
- **How:** add to `~/.tmux.conf`: `set -g allow-passthrough on`, `set -s extended-keys on`, `set -as terminal-features 'xterm*:extkeys'`, then `tmux source-file ~/.tmux.conf`.

---

## 8. claude.ai (web)

### Built-in appearance settings
- **What:** Color mode (Light, Match System, Dark) and chat font (Default, Match System, Dyslexic Friendly). No accent colors, custom themes or wallpapers.
- **How:** claude.ai → Settings → Appearance.

### Theming browser extensions (all unofficial, third-party)
- **What:** Extensions that restyle claude.ai by overriding its CSS. Notable ones: **AI Chat Themes** (Chrome; dark/light/AMOLED and custom palettes for ChatGPT and Claude), **Claudish** (Chrome; several visual styles, fonts, intensity), **Terminal Theme for Claude** (Chrome; green-on-black monospace look), **claude.ai Dark Mode** (Chrome; simple dark theme), **Claude Themes** (Firefox), **Gloam** (Chrome; dark theme for Claude Design only), and the **Catppuccin userstyle for Claude** via the Stylus extension (catppuccin/userstyles). Mantle's own extension (section 2) syncs with your Claude Code theme.
- **Use when:** You want more than light/dark on the web.
- **Caveats:** none are made or endorsed by Anthropic; check requested permissions (they read the pages you open on claude.ai); they can break when claude.ai changes its markup or CSS token names (one, Claude ReFlow, is already marked broken on the current UI). They only affect that browser.

---

## 9. Claude desktop app

- **What you can't do:** custom colors, themes, wallpapers or CSS. The app's bundle is integrity-checked, so modifying it isn't viable. Browser extensions don't apply to it.
- **What you can do:** in the Code tab, install plugins (**+** → Plugins), use mods (panes, commands), and set `outputStyle` in a settings file. For a themed Claude experience, use Claude Code in a themed terminal or claude.ai with an extension.
