# Mantle

**Make Claude yours. One theme across Claude Code, your terminal and claude.ai, alive to what Claude is doing.**

Mantle is an independent project and isn't affiliated with Anthropic.

## What's here

| Folder | What it is |
| --- | --- |
| [`mantle/`](mantle/) | The Claude Code plugin: the `/mantle` studio pane, live reactions, the Windows Terminal profile, the claude.ai Chrome extension and 10 presets |
| [`web/`](web/) | The Mantle web app: a gallery of themes, skills, connectors and plugins with live previews, a theme maker, and a "My Claude" dashboard for your local setup |

## Install the plugin

At the prompt of a Claude Code terminal session:

```
/plugin install mantle --marketplace akshittiwarii/mantle
```

From a shell:

```bash
claude plugin install mantle --marketplace akshittiwarii/mantle
```

In the Claude desktop app, where `/plugin` doesn't run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `akshittiwarii/mantle`, then **Add plugin**.

Then run `/mantle` to open the studio, or `/mantle aurora` to apply a preset everywhere. See [`mantle/README.md`](mantle/README.md) for the claude.ai extension and every option.

## Run the web app

```bash
cd web
npm install
npm run dev
```

Then open http://127.0.0.1:5173. See [`web/README.md`](web/README.md).

## License

MIT, see [LICENSE](LICENSE).
