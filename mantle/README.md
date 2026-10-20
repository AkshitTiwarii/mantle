# Mantle

**One theme for every Claude surface, alive to what Claude is doing.**

Pick a theme once and Mantle applies it to:

| Surface | What changes |
| --- | --- |
| **Claude Code** | Every interface color (accent, prompt border, diffs, message backgrounds), via a native theme file |
| **Windows Terminal** | A matching color scheme, your wallpaper behind the text, window opacity, acrylic blur and font, in a dedicated "Claude · Mantle" profile |
| **claude.ai** (Chrome) | Page colors, a blurred wallpaper behind frosted panels, and a glow while Claude responds |

Each surface can also be customized on its own: its own preset, accent, wallpaper or opacity.

### Live reactions

While you work, the Claude Code theme shifts with Claude's state:

| State | Color |
| --- | --- |
| idle | the theme's accent |
| thinking | second accent |
| running a tool | info color |
| plan mode | warning color |
| finished an answer | success, for 2.5 s |
| error or refusal | error, for 5 s |

On claude.ai a light sweeps across the top of the page and the accent shifts while a reply streams.

## Presets

Ember, Aurora, Synthwave, Tokyo Night, Catppuccin Mocha, Rosé Pine, Nord Night, Forest, Deep Ocean, Paper (light).

Tokyo Night, Catppuccin Mocha, Rosé Pine and Nord Night adapt the colors of [Tokyo Night](https://github.com/folke/tokyonight.nvim), [Catppuccin](https://catppuccin.com), [Rosé Pine](https://rosepinetheme.com) and [Nord](https://www.nordtheme.com); credit to their authors.

## Install

### Claude Code plugin

At the prompt of a terminal session:

```
/plugin install mantle --marketplace akshittiwarii/mantle
```

Or load it from this folder while developing:

```bash
claude --plugin-dir ./mantle
```

### claude.ai extension

1. In Claude Code run `/mantle apply` once. It writes the extension to `~/.claude/mantle/chrome-extension`.
2. In Chrome, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick that folder.

You can also load `chrome-extension/` from this repository directly. The popup then works on its own, without syncing from Claude Code.

## Use

| Command | What it does |
| --- | --- |
| `/mantle` | Opens the studio pane: presets, per-surface tabs, **Apply everywhere** |
| `/mantle apply` | Applies the current settings to every surface that is switched on |
| `/mantle <preset>` | Switches the preset and applies it, e.g. `/mantle synthwave` |
| `/mantle live off` | Stops the live reactions (`live on` turns them back on) |

The first time you apply, Claude Code switches its theme to **Mantle (live)**. If it can't switch automatically, pick that theme in `/theme`. The ten presets also appear in `/theme` as standalone themes.

In Windows Terminal, open **Claude · Mantle** from the new-tab menu. Open a new window if it doesn't show up yet.

## How it works

- **Claude Code:** Mantle writes `~/.claude/themes/mantle.json`, and Claude Code reloads it whenever the file changes. Live reactions rewrite that one file as Claude's state changes.
- **Windows Terminal:** Mantle writes a [settings fragment](https://learn.microsoft.com/windows/terminal/json-fragment-extensions) to `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\Mantle\mantle.json`. It never edits your own `settings.json`.
- **claude.ai:** The extension overrides the site's `--cds-*` CSS color tokens. Settings come from the popup, or from `mantle-theme.json`, which the studio writes beside the extension. The newer of the two wins.

Everything stays on your machine. Mantle makes no network calls.

## Limits

- The Claude desktop app can't be themed: its app bundle is integrity-checked.
- The claude.ai theme depends on the site's CSS token names. A redesign may need a Mantle update.
- Wallpapers given as a file path must be under 3 MB. Use an https URL for larger images.
