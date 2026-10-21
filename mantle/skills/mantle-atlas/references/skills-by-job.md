# Skills by job

The most useful and most installed public Agent Skills, grouped by the job you need done, with when to pick each one and how to install it.

Source: skills.sh + each skill's SKILL.md, collected 2026-10-21.

This file is a curated short list (about 170 skills and packs). The full index of about 30k skills lives in `data/skills.tsv` (searchable with grep / rg). Install counts are all-time installs from the skills.sh search API on the date above. Some very high counts come from bundled packs that install many skills at once, so treat installs as a popularity signal, not a quality score. Most install commands use the open `skills` CLI (`npx skills add <owner/repo> --skill <skillId>`), which works across Claude Code, Codex, Cursor, Copilot and other agents; a few tools ship as a Claude Code plugin, an MCP server or a shadcn registry instead, and say so.

---

## Documents & office files

### pdf — anthropics/skills
- **What:** All-purpose PDF toolkit: read, extract text and tables, merge, split, rotate, watermark, fill forms, encrypt, and OCR scanned pages.
- **Use when:** Any task that takes a .pdf as input or must produce one, especially form filling and text or table extraction.
- **Skip when:** Visual fidelity of a generated PDF is the main concern (openai/skills `pdf` renders pages to check layout), or you only need shell-level merge/split on a server (`pdftk-server`).
- **Install:** `npx skills add anthropics/skills --skill pdf`
- **Installs:** 213,790

### docx — anthropics/skills
- **What:** Creates, reads and edits Word documents and .dotx templates, including tracked changes, comments, images and find-and-replace.
- **Use when:** The deliverable must be a .docx (reports, memos, letters with TOC, headers, page numbers), or you must edit an existing Word file in place.
- **Skip when:** You just need the text out of a Word file (`convert-documents-to-markdown`), or the user wants a doc without naming a format and the host has its own document type.
- **Install:** `npx skills add anthropics/skills --skill docx`
- **Installs:** 204,235

### xlsx — anthropics/skills
- **What:** Opens, cleans, edits and builds spreadsheets (.xlsx, .xlsm, .csv, .tsv) with formulas, formatting and charts.
- **Use when:** A spreadsheet file is the main input or output: adding columns, fixing formulas, restructuring messy tabular data, converting between tabular formats.
- **Skip when:** You need to drive a live, open Excel instance or run VBA (`excel-automation`), or the deliverable is an analysis report rather than a workbook (`data-analysis`, `build-dashboard`).
- **Install:** `npx skills add anthropics/skills --skill xlsx`
- **Installs:** 185,272

### pptx — anthropics/skills
- **What:** Creates, parses and edits PowerPoint decks and .potx templates, including layouts, speaker notes and comments.
- **Use when:** A .pptx is involved in any way, whether building a pitch deck or pulling text out of an existing presentation.
- **Skip when:** The user wants slides but not specifically PowerPoint and the host offers a native slide format; for sales-collateral content strategy use `sales-enablement` first.
- **Install:** `npx skills add anthropics/skills --skill pptx`
- **Installs:** 239,099

### pdf — openai/skills
- **What:** PDF reading, creation and review that renders pages with Poppler for visual checks and uses reportlab, pdfplumber and pypdf.
- **Use when:** Layout and rendering matter, such as generating a designed PDF and verifying how it looks page by page.
- **Skip when:** You need form filling, OCR or encryption in one place (anthropics `pdf`).
- **Install:** `npx skills add openai/skills --skill pdf`
- **Installs:** 13,293

### pdftk-server — github/awesome-copilot
- **What:** Drives the pdftk command-line tool to merge, split, rotate, encrypt, stamp, fill forms, burst pages and repair PDFs.
- **Use when:** You want deterministic CLI PDF manipulation in a shell or server pipeline without Python libraries.
- **Skip when:** You need text or table extraction or OCR (anthropics `pdf`).
- **Install:** `npx skills add github/awesome-copilot --skill pdftk-server`
- **Installs:** 9,978

### excel-automation — claude-office-skills/skills
- **What:** Automates a live Excel instance through xlwings, so it can run VBA macros, refresh dashboards and script workbook workflows.
- **Use when:** The workbook must stay open in Excel (macros, add-ins, live dashboards) rather than being edited as a file.
- **Skip when:** File-only edits are enough (anthropics `xlsx`), or Excel is not installed (xlwings needs desktop Excel).
- **Install:** `npx skills add claude-office-skills/skills --skill excel-automation`
- **Installs:** 15,673

### convert-documents-to-markdown — firecrawl/anydoc
- **What:** Converts Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV and PDF files into GitHub-flavored Markdown.
- **Use when:** You need to read the contents of an office file or ebook the agent cannot open directly, for example before summarizing or quoting it.
- **Skip when:** You must edit and save back to the original format (`docx`, `xlsx`, `pptx`).
- **Install:** `npx skills add firecrawl/anydoc --skill convert-documents-to-markdown`
- **Installs:** 12,166

## Design & frontend

### frontend-design — anthropics/skills
- **What:** Steers new or reshaped UI toward a deliberate aesthetic direction and typography so it does not look like a template default.
- **Use when:** Building a landing page, app screen or component from scratch and you want it to look designed rather than generic.
- **Skip when:** You are auditing existing UI against rules (`web-design-guidelines`) or want a full critique/polish workflow (`impeccable`).
- **Install:** `npx skills add anthropics/skills --skill frontend-design`
- **Installs:** 1,009,684

### web-design-guidelines — vercel-labs/agent-skills
- **What:** Reviews UI code against Vercel's Web Interface Guidelines covering accessibility, UX and interaction details.
- **Use when:** Someone asks to "review my UI", "check accessibility" or "audit design" on existing code.
- **Skip when:** You are creating new visuals (`frontend-design`, `design-taste-frontend`).
- **Install:** `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`
- **Installs:** 762,416

### design-taste-frontend — leonxlnx/taste-skill
- **What:** Art direction for websites built from a study of curated gallery sites, with a strict anti-"AI slop" house style and a screenshot look-and-fix loop.
- **Use when:** Building, restyling or polishing a landing page or marketing site where visual taste is the main goal.
- **Skip when:** You are working on dense product UI or dashboards (`impeccable`, `ui-ux-pro-max`).
- **Install:** `npx skills add leonxlnx/taste-skill --skill design-taste-frontend`
- **Installs:** 644,497

### ui-ux-pro-max — nextlevelbuilder/ui-ux-pro-max-skill
- **What:** Searchable local design knowledge (styles, product palettes, font pairings, chart and stack guidance) for designing and fixing web, mobile and desktop UI.
- **Use when:** You need concrete choices such as a palette, font pairing or style for a specific product type and stack.
- **Skip when:** You want a strong single point of view instead of a catalogue (`frontend-design`, `design-taste-frontend`).
- **Install:** `npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max`
- **Installs:** 406,027

### impeccable — pbakaus/impeccable
- **What:** A full frontend design workflow: shape, critique, audit, polish, simplify, harden and animate interfaces, including native iOS/Android screens and DESIGN.md capture.
- **Use when:** Improving an existing interface end to end (hierarchy, layout, color, motion, UX copy, accessibility, edge cases).
- **Skip when:** Only a quick rules-based review is needed (`web-design-guidelines`).
- **Install:** `npx skills add pbakaus/impeccable --skill impeccable`
- **Installs:** 346,774

### shadcn — shadcn-ui/ui
- **What:** Official shadcn/ui skill for adding, searching, fixing, styling and composing components, registries and presets in projects with a components.json.
- **Use when:** The project uses shadcn/ui, or you are running `shadcn init` / `--preset` or building chat UIs from shadcn components.
- **Skip when:** The project uses a different component library; for overall look use `frontend-design`.
- **Install:** `npx skills add shadcn-ui/ui --skill shadcn`
- **Installs:** 386,968

### emil-design-eng — emilkowalski/skills
- **What:** Emil Kowalski's design-engineering philosophy on UI polish, component design, animation decisions and small details.
- **Use when:** Polishing micro-interactions and motion so a product feels crafted.
- **Skip when:** You need layout or visual direction from scratch (`frontend-design`).
- **Install:** `npx skills add emilkowalski/skills --skill emil-design-eng`
- **Installs:** 369,797

### canvas-design — anthropics/skills
- **What:** Produces original static visual art (posters, designs) as .png or .pdf, guided by a written design philosophy.
- **Use when:** The output is a standalone image or poster rather than a web page.
- **Skip when:** You want generative or code-driven art (`algorithmic-art`) or AI photo-style images (`imagegen`).
- **Install:** `npx skills add anthropics/skills --skill canvas-design`
- **Installs:** 119,698

### web-artifacts-builder — anthropics/skills
- **What:** Tooling for elaborate multi-component claude.ai HTML artifacts built with React, Tailwind and shadcn/ui.
- **Use when:** A claude.ai artifact needs state management, routing or shadcn components.
- **Skip when:** A simple single-file HTML/JSX artifact will do, or you are building a real repo app (`vercel-react-best-practices`).
- **Install:** `npx skills add anthropics/skills --skill web-artifacts-builder`
- **Installs:** 110,724

### design-mobile-apps — designed-by-ai/skills
- **What:** Designs mobile app screens through the Sleek (sleek.design) API, edits Sleek projects and implements them in React Native or HTML.
- **Use when:** You have a Sleek account and want generated mobile screen designs turned into code.
- **Skip when:** You have no `SLEEK_API_KEY` (required); for native-feeling Expo UI without a service use `expo-native-ui`.
- **Install:** `npx skills add designed-by-ai/skills --skill design-mobile-apps`
- **Installs:** 925,210

## Animation, motion & video

### gsap skills — greensock/gsap-skills
- **What:** GreenSock's official skills for GSAP: core tweens, timelines, ScrollTrigger, plugins, React (useGSAP), utilities and performance.
- **Use when:** You're writing JavaScript animation or scroll-driven effects with GSAP and want the agent to use the current API correctly.
- **Skip when:** Simple UI state transitions that CSS or Motion (Framer Motion) already handle (`transitions-dev`).
- **Install:** `npx skills add https://github.com/greensock/gsap-skills`

### cinematic-gsap-lenis-motion-system — mengto/skills
- **What:** A connected motion language built on Lenis smooth scrolling + GSAP + ScrollTrigger: reveals, pinned scenes, parallax, staggered text, cursor effects.
- **Use when:** Editorial or Awwwards-style marketing sites that need smooth scroll and choreographed motion. (There is no official Lenis skill; this is the most-installed real one.)
- **Skip when:** App UI or dashboards, where smooth-scroll hijacking hurts usability.
- **Install:** `npx skills add mengto/skills --skill cinematic-gsap-lenis-motion-system`

### transitions.dev — Jakubantalik/transitions.dev
- **What:** A library of portable CSS UI transitions (menus, modals, icon swaps, number pop-ins) as skills, plus a polish skill that tunes existing motion against timing and easing tokens.
- **Use when:** UI state changes feel abrupt and you want crafted, dependency-free transitions.
- **Skip when:** Long scroll-driven sequences (GSAP skills). License is custom: free to use, not to redistribute the library.
- **Install:** `npx skills add Jakubantalik/transitions.dev`

### React Bits — DavidHDev/react-bits (shadcn registry)
- **What:** 215+ free animated React components and backgrounds, installed through the shadcn registry and MCP rather than a skill.
- **Use when:** You want a ready-made animated text effect, background or card instead of writing the animation yourself.
- **Skip when:** You need no React, or the license (MIT + Commons Clause) conflicts with reselling the components.
- **Install:** add `"@react-bits": "https://reactbits.dev/r/{name}.json"` under `registries` in components.json, then `npx shadcn@latest mcp init --client claude`; or one component: `npx shadcn@latest add @react-bits/SplitText-TS-TW`

### 21st.dev skills — 21st-dev/skill
- **What:** 21st.dev's own skills for its CLI: search and install React/shadcn components, generate UI with 21st AI, publish components and themes. The Claude Code plugin `21st-dev/claude-code-plugin` bundles them with the 21st MCP server (successor to Magic MCP).
- **Use when:** Building UI from community components rather than from scratch.
- **Skip when:** You can't add an API key (needs `API_KEY_21ST` or `npx @21st-dev/cli login`).
- **Install:** `npx skills add 21st-dev/skill` — or the plugin: `/plugin marketplace add 21st-dev/claude-code-plugin` then `/plugin install 21st@21st`

### designlang — Manavarya09/design-extract
- **What:** Reads a live website's design system off the DOM and emits DTCG tokens, a Tailwind config, a shadcn theme and Figma variables. Ships as a plugin (/extract, /grade, /remix), an MCP server and a skill.
- **Use when:** "Make it look like site X", auditing a site's tokens, or seeding a design system from an existing product.
- **Skip when:** Copying a brand you don't own; use it for reference and your own sites.
- **Install:** `/plugin marketplace add Manavarya09/design-extract` then `/plugin install designlang@designlang` — or MCP: `claude mcp add designlang -- npx -y designlang mcp`

### REA: Reverse Engineer Anything — morluto/rea
- **What:** An MCP server and skill for working out how an app feature works without its source: native binaries, JavaScript/Electron apps, .NET assemblies and websites (optionally via Hopper, Ghidra or IDA).
- **Use when:** Investigating your own or permitted software, interoperability, or debugging a closed component.
- **Skip when:** It would break a license or terms of service. Only morluto/rea and the rea-agents npm package are official; ignore look-alike copies.
- **Install:** `npx rea-agents setup` (pick Claude Code) — skill only: `npx skills add morluto/rea --skill reverse-engineer-anything`

### Motion graphics video — three picks
- **remotion-best-practices (remotion-dev/skills):** the official Remotion skill; start here for programmatic video in React. `npx skills add remotion-dev/skills --skill remotion-best-practices`
- **motion-graphics-skills (charlie947):** 15 workflows for launch films, explainers, animated charts and reels; MP4 export via HyperFrames. `npx skills add charlie947/motion-graphics-skills` then `npx skills add heygen-com/hyperframes`
- **remotion-motion-graphics-skill (Liamrjohnston):** kinetic text, cinematic camera moves, terminal demos and article highlights as finished Remotion clips. `npx skills add liamrjohnston/remotion-motion-graphics-skill`
- **motion-design-skills (iart-ai):** fundamentals — animation principles, color, composition, art direction, beat-synced edits, logo reveals, After Effects. `/plugin marketplace add iart-ai/motion-design-skills` then `/plugin install motion-design-skills`
- **Use when:** Product launch videos, demo reels, social clips and animated data stories rendered from code.
- **Skip when:** You need live-action editing; these generate motion graphics, not cuts of real footage.

## Web frameworks

### vercel-react-best-practices — vercel-labs/agent-skills
- **What:** Vercel Engineering's React and Next.js performance rules for components, data fetching and bundle size.
- **Use when:** Writing, reviewing or refactoring React/Next.js code where performance matters.
- **Skip when:** The problem is component API design (`vercel-composition-patterns`) or visual design (`frontend-design`).
- **Install:** `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices`
- **Installs:** 822,014

### vercel-composition-patterns — vercel-labs/agent-skills
- **What:** React composition patterns (compound components, render props, context providers) including React 19 API changes.
- **Use when:** A component has boolean-prop sprawl or you are designing a reusable component library API.
- **Skip when:** You are chasing render or bundle performance (`vercel-react-best-practices`).
- **Install:** `npx skills add vercel-labs/agent-skills --skill vercel-composition-patterns`
- **Installs:** 407,377

### next-dev-loop — vercel/next.js
- **What:** Official Next.js skill that verifies runtime behavior after edits by combining the dev server's /_next/mcp view with agent-browser.
- **Use when:** You need to confirm a Next.js change actually works in a running `next dev`, not just that it compiles.
- **Skip when:** There is no running dev server; for general browser checks use `agent-browser`.
- **Install:** `npx skills add vercel/next.js --skill next-dev-loop`
- **Installs:** 21,158

### vue-best-practices — vuejs-ai/skills
- **What:** Vue 3 guidance that defaults to Composition API with `<script setup>` and TypeScript, covering SSR, Volar, Vue Router, Pinia and Vite.
- **Use when:** Any Vue or .vue work.
- **Install:** `npx skills add vuejs-ai/skills --skill vue-best-practices`
- **Installs:** 41,846

### angular-developer — angular/skills
- **What:** Official Angular skill that generates code and gives architecture guidance on signals, forms, DI, routing, SSR/hydration and accessibility.
- **Use when:** Creating or modernizing Angular projects, components and services.
- **Install:** `npx skills add angular/skills --skill angular-developer`
- **Installs:** 44,939

### svelte-code-writer — sveltejs/ai-tools
- **What:** Official Svelte CLI tooling for Svelte 5 documentation lookup and code analysis.
- **Use when:** Creating, editing or analyzing any .svelte or .svelte.ts/.svelte.js file.
- **Install:** `npx skills add sveltejs/ai-tools --skill svelte-code-writer`
- **Installs:** 12,395

### better-auth-best-practices — better-auth/skills
- **What:** Configures Better Auth server and client, database adapters, sessions, plugins and environment variables.
- **Use when:** Adding TypeScript auth (email/password, OAuth, plugins) with Better Auth.
- **Skip when:** You are hardening an existing setup (`better-auth-security-best-practices` in the same repo) or using Supabase Auth (`supabase`).
- **Install:** `npx skills add better-auth/skills --skill better-auth-best-practices`
- **Installs:** 125,082

### stripe-best-practices — stripe/ai
- **What:** Official Stripe guidance for integration decisions: sandboxes, Checkout Sessions vs PaymentIntents, Connect, billing, tax and Treasury.
- **Use when:** Designing or reviewing a Stripe payments or subscriptions integration.
- **Install:** `npx skills add stripe/ai --skill stripe-best-practices`
- **Installs:** 29,817

## Testing & quality

### tdd — mattpocock/skills
- **What:** Test-first development with a red-green-refactor loop, favoring integration tests.
- **Use when:** The user wants to build a feature or fix a bug test-first.
- **Skip when:** You want TDD enforced on every change as part of a larger workflow (`test-driven-development` from superpowers).
- **Install:** `npx skills add mattpocock/skills --skill tdd`
- **Installs:** 1,120,182

### test-driven-development — obra/superpowers
- **What:** Superpowers' rule that any feature or bugfix starts with a failing test before implementation code.
- **Use when:** You use the superpowers workflow and want TDD applied by default.
- **Skip when:** You prefer Matt Pocock's lighter `tdd` loop.
- **Install:** `npx skills add obra/superpowers --skill test-driven-development`
- **Installs:** 255,703

### verification-before-completion — obra/superpowers
- **What:** Requires running verification commands and reading their output before claiming work is done, fixed or passing.
- **Use when:** Before committing, opening a PR, or telling the user something works.
- **Install:** `npx skills add obra/superpowers --skill verification-before-completion`
- **Installs:** 247,204

### webapp-testing — anthropics/skills
- **What:** Playwright toolkit for exercising local web apps: verify functionality, debug UI behavior, take screenshots, read browser logs.
- **Use when:** Checking that a locally running web app behaves correctly.
- **Skip when:** You are writing a maintained Playwright test suite (`playwright-best-practices`) or automating third-party sites (`agent-browser`).
- **Install:** `npx skills add anthropics/skills --skill webapp-testing`
- **Installs:** 182,791

### playwright-cli — microsoft/playwright-cli
- **What:** Official Microsoft skill for automating browser interactions, testing pages and working with Playwright tests via the Playwright CLI.
- **Use when:** You want Playwright's own CLI to drive a browser or run tests from the terminal.
- **Install:** `npx skills add microsoft/playwright-cli --skill playwright-cli`
- **Installs:** 190,836

### playwright-best-practices — currents-dev/playwright-best-practices-skill
- **What:** Deep guide to writing robust Playwright suites: flaky tests, Page Object Model, CI, API mocking, auth, accessibility, uploads and more.
- **Use when:** Writing or stabilizing a Playwright test suite.
- **Install:** `npx skills add currents-dev/playwright-best-practices-skill --skill playwright-best-practices`
- **Installs:** 96,476

### vitest — antfu/skills
- **What:** Vitest reference for writing tests, mocking, coverage, filtering and fixtures.
- **Use when:** The project uses Vitest (Vite-based, Jest-compatible).
- **Install:** `npx skills add antfu/skills --skill vitest`
- **Installs:** 41,915

### performance-optimization — addyosmani/agent-skills
- **What:** Measures and fixes performance across frontend, backend and database: Core Web Vitals, N+1 queries, profiling-led fixes.
- **Use when:** You have a performance requirement or suspect a regression.
- **Skip when:** It is specifically React/Next.js rendering (`vercel-react-best-practices`) or Vercel costs (`vercel-optimize`).
- **Install:** `npx skills add addyosmani/agent-skills --skill performance-optimization`
- **Installs:** 60,493

## Debugging

### systematic-debugging — obra/superpowers
- **What:** Forces a root-cause investigation before any fix is proposed for a bug, test failure or unexpected behavior.
- **Use when:** Anything is broken and you are tempted to guess at a fix.
- **Install:** `npx skills add obra/superpowers --skill systematic-debugging`
- **Installs:** 301,473

### diagnosing-bugs — mattpocock/skills
- **What:** A diagnosis loop for hard bugs and performance regressions.
- **Use when:** The user says "debug this" or reports something broken, throwing, failing or slow.
- **Install:** `npx skills add mattpocock/skills --skill diagnosing-bugs`
- **Installs:** 814,902

### debugging-and-error-recovery — addyosmani/agent-skills
- **What:** Systematic root-cause debugging for failing tests, broken builds and regressions.
- **Use when:** Something that worked yesterday broke and you need to find out why.
- **Install:** `npx skills add addyosmani/agent-skills --skill debugging-and-error-recovery`
- **Installs:** 58,615

### diagnose-ci-failures — warpdotdev/common-skills
- **What:** Pulls a PR's CI status and logs with the GitHub CLI, extracts errors and writes a fix plan.
- **Use when:** CI is red on a PR and you need to triage test or build failures.
- **Install:** `npx skills add warpdotdev/common-skills --skill diagnose-ci-failures`
- **Installs:** 28,115

### gh-fix-ci — openai/skills
- **What:** Inspects failing GitHub Actions checks with `gh`, summarizes failures, drafts a fix plan and implements only after approval.
- **Use when:** Fixing failing GitHub Actions checks on a PR with an approval gate.
- **Skip when:** CI runs outside GitHub Actions (for example Buildkite), which it treats as out of scope.
- **Install:** `npx skills add openai/skills --skill gh-fix-ci`
- **Installs:** 11,279

## Git & code review

### code-review — mattpocock/skills
- **What:** Reviews changes since a commit, branch or tag along two axes, repo standards and the originating spec, in parallel subagents.
- **Use when:** Reviewing a branch, PR or work in progress against both coding standards and what the ticket asked for.
- **Install:** `npx skills add mattpocock/skills --skill code-review`
- **Installs:** 768,770

### requesting-code-review — obra/superpowers
- **What:** Prompts a review checkpoint after tasks or major features and before merging, to confirm work meets requirements.
- **Use when:** Finishing a chunk of work in the superpowers workflow.
- **Install:** `npx skills add obra/superpowers --skill requesting-code-review`
- **Installs:** 258,146

### receiving-code-review — obra/superpowers
- **What:** Makes the agent verify review feedback technically before applying it, instead of agreeing blindly.
- **Use when:** You have review comments to act on, especially unclear or questionable ones.
- **Install:** `npx skills add obra/superpowers --skill receiving-code-review`
- **Installs:** 217,883

### code-review-and-quality — addyosmani/agent-skills
- **What:** Multi-axis code review for any diff or PR, whether written by you, another agent or a human.
- **Use when:** Before merging any change, including a diff pasted inline.
- **Install:** `npx skills add addyosmani/agent-skills --skill code-review-and-quality`
- **Installs:** 68,509

### code-review — coderabbitai/skills
- **What:** Runs CodeRabbit CLI reviews and retrieves saved PR fix prompts.
- **Use when:** You use CodeRabbit and want its review output and runbooks inside the agent.
- **Skip when:** You do not have CodeRabbit set up; use an agent-native reviewer above.
- **Install:** `npx skills add coderabbitai/skills --skill code-review`
- **Installs:** 14,379

### resolve-merge-conflicts — warpdotdev/common-skills
- **What:** Resolves merge, rebase or cherry-pick conflicts by loading only conflict hunks and compact diffs, not whole files.
- **Use when:** `git status` shows unmerged paths or files contain conflict markers.
- **Install:** `npx skills add warpdotdev/common-skills --skill resolve-merge-conflicts`
- **Installs:** 28,250

### using-git-worktrees — obra/superpowers
- **What:** Sets up an isolated git worktree before feature work or plan execution.
- **Use when:** You want parallel or isolated work without disturbing the current checkout.
- **Install:** `npx skills add obra/superpowers --skill using-git-worktrees`
- **Installs:** 214,158

### git-commit — github/awesome-copilot
- **What:** Stages changes intelligently and writes Conventional Commit messages generated from the diff.
- **Use when:** Asked to commit, or to split changes into logical conventional commits.
- **Install:** `npx skills add github/awesome-copilot --skill git-commit`
- **Installs:** 46,756

### git-guardrails-claude-code — mattpocock/skills
- **What:** Installs Claude Code hooks that block destructive git commands (push, reset --hard, clean, branch -D).
- **Use when:** You want hard safety rails against an agent rewriting or deleting history.
- **Install:** `npx skills add mattpocock/skills --skill git-guardrails-claude-code`
- **Installs:** 486,250

### improve-codebase-architecture — mattpocock/skills
- **What:** Scans a codebase for "deepening" opportunities, presents them as a visual HTML report, then interviews you through the one you choose.
- **Use when:** Planning a refactor or architecture cleanup rather than reviewing a single diff.
- **Install:** `npx skills add mattpocock/skills --skill improve-codebase-architecture`
- **Installs:** 1,142,080

## Security

### security-review — getsentry/skills
- **What:** Systematic code security review (injection, XSS, authn/authz, crypto) with confidence-based findings.
- **Use when:** Asked for a security review, vulnerability hunt or OWASP review of code.
- **Install:** `npx skills add getsentry/skills --skill security-review`
- **Installs:** 20,511

### security-and-hardening — addyosmani/agent-skills
- **What:** Hardens code that handles untrusted input, sessions, data storage or third-party integrations against the OWASP Top Ten.
- **Use when:** Building or auditing a feature that accepts user input or manages auth.
- **Install:** `npx skills add addyosmani/agent-skills --skill security-and-hardening`
- **Installs:** 64,946

### security-threat-model — openai/skills
- **What:** Repository-grounded threat model listing trust boundaries, assets, attacker capabilities, abuse paths and mitigations, written as Markdown.
- **Use when:** Explicitly asked to threat-model a codebase or path.
- **Skip when:** You want a line-by-line vulnerability review (`security-review`).
- **Install:** `npx skills add openai/skills --skill security-threat-model`
- **Installs:** 7,848

### security-best-practices — openai/skills
- **What:** Language and framework specific secure-coding review for Python, JavaScript/TypeScript and Go.
- **Use when:** Asked for secure-by-default guidance or a security report in those languages.
- **Install:** `npx skills add openai/skills --skill security-best-practices`
- **Installs:** 10,850

### codeql — trailofbits/skills
- **What:** Runs CodeQL interprocedural data-flow and taint analysis across many languages to find vulnerabilities.
- **Use when:** You want a real SAST scan, not just an LLM read-through.
- **Skip when:** You want quick pattern rules (`semgrep`).
- **Install:** `npx skills add trailofbits/skills --skill codeql`
- **Installs:** 8,108

### semgrep — semgrep/skills
- **What:** Official skill for running Semgrep scans and writing custom YAML detection rules.
- **Use when:** Scanning for vulnerabilities or bug patterns, or enforcing a custom code rule.
- **Install:** `npx skills add semgrep/skills --skill semgrep`
- **Installs:** 2,143

### firebase-security-rules-auditor — firebase/agent-skills
- **What:** Audits Firestore and Cloud Storage security rules for privilege escalation, role bypasses and ownership gaps.
- **Use when:** Reviewing or red-teaming Firebase rules.
- **Skip when:** You are setting up Firebase CLI or Auth (`firebase-basics`).
- **Install:** `npx skills add firebase/agent-skills --skill firebase-security-rules-auditor`
- **Installs:** 135,667

## Databases

### supabase-postgres-best-practices — supabase/agent-skills
- **What:** Supabase-maintained Postgres rules for schemas, column types, migrations, RLS policies, indexes, triggers and scheduled jobs; applies to Postgres anywhere.
- **Use when:** Before writing or changing anything that lives in a Postgres database.
- **Install:** `npx skills add supabase/agent-skills --skill supabase-postgres-best-practices`
- **Installs:** 453,163

### supabase — supabase/agent-skills
- **What:** Covers every Supabase product (DB, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues), supabase-js/SSR, CLI and MCP.
- **Use when:** Any task involving a Supabase project.
- **Skip when:** The question is generic Postgres design (`supabase-postgres-best-practices`).
- **Install:** `npx skills add supabase/agent-skills --skill supabase`
- **Installs:** 335,489

### neon-postgres — neondatabase/agent-skills
- **What:** Working with Postgres on Neon: pooled vs direct connections, migrations, branching, autoscaling, read replicas.
- **Use when:** The database is on Neon or you want database branching per preview.
- **Install:** `npx skills add neondatabase/agent-skills --skill neon-postgres`
- **Installs:** 262,166

### prisma-client-api — prisma/skills
- **What:** Prisma Client reference for model queries, filters, operators, transactions and client methods.
- **Use when:** Writing database queries with Prisma (findMany, create, $transaction).
- **Skip when:** Setting up Prisma for the first time (`prisma-orm-setup` in the same repo).
- **Install:** `npx skills add prisma/skills --skill prisma-client-api`
- **Installs:** 375,575

### convex — convex/agent-skills
- **What:** Building on Convex, the all-TypeScript reactive backend where database, functions, scheduling, storage, auth and realtime sync are one system.
- **Use when:** Prototyping or scaling an app on Convex.
- **Install:** `npx skills add convex/agent-skills --skill convex`
- **Installs:** 106,226

### firebase-firestore — firebase/agent-skills
- **What:** Sets up and queries Cloud Firestore: data modeling, indexes and SDK integration for Web, Python, iOS, Android and Flutter.
- **Use when:** Creating Firestore databases, models or queries.
- **Skip when:** Writing or auditing security rules (`firebase-security-rules-auditor`).
- **Install:** `npx skills add firebase/agent-skills --skill firebase-firestore`
- **Installs:** 132,405

### postgresql-table-design — wshobson/agents
- **What:** PostgreSQL schema design guidance: data types, indexing, constraints and performance patterns.
- **Use when:** Designing or reviewing a Postgres schema outside Supabase-specific concerns.
- **Install:** `npx skills add wshobson/agents --skill postgresql-table-design`
- **Installs:** 27,547

### mongodb-query-optimizer — mongodb/agent-skills
- **What:** Official MongoDB skill for diagnosing slow queries and choosing indexes.
- **Use when:** A MongoDB query or cluster is slow and you need index or query changes.
- **Skip when:** You are just writing ordinary queries; it is scoped to performance work.
- **Install:** `npx skills add mongodb/agent-skills --skill mongodb-query-optimizer`
- **Installs:** 6,755

## Deploy & infra

### deploy-to-vercel — vercel-labs/agent-skills
- **What:** Deploys apps and sites to Vercel and returns preview or production links.
- **Use when:** "Deploy my app", "push this live" or "make a preview deployment" on Vercel.
- **Skip when:** You are tuning cost or performance of an existing deployment (`vercel-optimize` in the same repo).
- **Install:** `npx skills add vercel-labs/agent-skills --skill deploy-to-vercel`
- **Installs:** 162,797

### cloudflare — cloudflare/skills
- **What:** Helps pick the right Cloudflare products for apps, APIs, agents, storage, networking and security, then routes to the specific skill or docs.
- **Use when:** You describe a need and want to know which Cloudflare product fits.
- **Install:** `npx skills add cloudflare/skills --skill cloudflare`
- **Installs:** 131,488

### workers-best-practices — cloudflare/skills
- **What:** Production best practices for writing, reviewing and configuring Cloudflare Workers.
- **Use when:** Writing or reviewing Worker code.
- **Install:** `npx skills add cloudflare/skills --skill workers-best-practices`
- **Installs:** 120,129

### netlify-deploy — netlify/context-and-tools
- **What:** Official Netlify skill for Git continuous deployment, CLI deploys, netlify.toml contexts, build hooks, deploy previews and fixing failed deploys.
- **Use when:** Deploying or debugging a site on Netlify.
- **Install:** `npx skills add netlify/context-and-tools --skill netlify-deploy`
- **Installs:** 3,226

### terraform-style-guide — hashicorp/agent-skills
- **What:** Generates and reviews Terraform HCL following HashiCorp's official style conventions.
- **Use when:** Writing or reviewing Terraform configurations.
- **Install:** `npx skills add hashicorp/agent-skills --skill terraform-style-guide`
- **Installs:** 12,383

### pulumi-best-practices — pulumi/agent-skills
- **What:** Pulumi TypeScript/Python guidance on Output<T>/apply, ComponentResources, aliases for safe refactors, secrets and CI previews.
- **Use when:** Writing, reviewing or debugging Pulumi programs.
- **Install:** `npx skills add pulumi/agent-skills --skill pulumi-best-practices`
- **Installs:** 2,463

### multi-stage-dockerfile — github/awesome-copilot
- **What:** Writes optimized multi-stage Dockerfiles for any language or framework.
- **Use when:** Containerizing an app or shrinking an existing image.
- **Install:** `npx skills add github/awesome-copilot --skill multi-stage-dockerfile`
- **Installs:** 29,586

### github-actions-templates — wshobson/agents
- **What:** Production-ready GitHub Actions workflows for testing, building and deploying, plus reusable workflow templates.
- **Use when:** Setting up CI/CD on GitHub Actions.
- **Skip when:** Existing CI is failing (`gh-fix-ci`, `diagnose-ci-failures`).
- **Install:** `npx skills add wshobson/agents --skill github-actions-templates`
- **Installs:** 17,246

### kubernetes-specialist — jeffallan/claude-skills
- **What:** Kubernetes manifests, Helm charts, RBAC, NetworkPolicies, storage, pod debugging and right-sizing.
- **Use when:** Deploying or operating workloads on any Kubernetes cluster.
- **Skip when:** You are provisioning AKS specifically (`azure-kubernetes`).
- **Install:** `npx skills add jeffallan/claude-skills --skill kubernetes-specialist`
- **Installs:** 13,886

## Cloud platforms

### azure-deploy — microsoft/azure-skills
- **What:** Runs Azure deployments (azd up/deploy, terraform apply, az deployment) with error recovery for apps already prepared.
- **Use when:** An app has an `.azure/deployment-plan.md` and validated infrastructure and is ready to ship.
- **Skip when:** Creating a new app for Azure (`azure-prepare` in the same repo first).
- **Install:** `npx skills add microsoft/azure-skills --skill azure-deploy`
- **Installs:** 561,741

### microsoft-foundry — microsoft/azure-skills
- **What:** Builds, deploys, evaluates, fine-tunes and manages Microsoft Foundry agents and models end to end.
- **Use when:** Working with Azure AI Foundry agents, models or evaluations.
- **Install:** `npx skills add microsoft/azure-skills --skill microsoft-foundry`
- **Installs:** 571,110

### azure-kubernetes — microsoft/azure-skills
- **What:** Plans and creates production AKS clusters: SKU choice, networking, security, autoscaling and upgrades.
- **Use when:** Provisioning or designing AKS.
- **Install:** `npx skills add microsoft/azure-skills --skill azure-kubernetes`
- **Installs:** 427,593

### aws-serverless — aws/agent-toolkit-for-aws
- **What:** Official AWS router for serverless work (Lambda, API Gateway, EventBridge, Step Functions) that picks the compute form and the skill that owns it.
- **Use when:** Building APIs, webhooks, jobs or event-driven workflows on AWS and the service choice is still open.
- **Install:** `npx skills add aws/agent-toolkit-for-aws --skill aws-serverless`
- **Installs:** 9,845

### aws-cdk — aws/agent-toolkit-for-aws
- **What:** Authors, deploys and troubleshoots AWS infrastructure with CDK in TypeScript or Python.
- **Use when:** Writing constructs, running cdk deploy/synth/diff, or fixing CDK/CloudFormation errors and drift.
- **Install:** `npx skills add aws/agent-toolkit-for-aws --skill aws-cdk`
- **Installs:** 9,163

### cloud-run-basics — google/skills
- **What:** Official Google Cloud skill for Cloud Run services, jobs and worker pools.
- **Use when:** Deploying HTTP services, scheduled or event-driven jobs, or background workers on Cloud Run.
- **Install:** `npx skills add google/skills --skill cloud-run-basics`
- **Installs:** 17,285

### gemini-api — google/skills
- **What:** Using Gemini through Google Cloud / Vertex AI with the Gen AI SDK: multimodal input, tools, media generation, caching, batch and Live API.
- **Use when:** Building with Gemini in an enterprise Google Cloud environment.
- **Skip when:** Calling Gemini from a mobile or web client via Firebase (`firebase-ai-logic-basics` in firebase/agent-skills).
- **Install:** `npx skills add google/skills --skill gemini-api`
- **Installs:** 16,899

### firebase-basics — firebase/agent-skills
- **What:** Firebase CLI install, login, project creation/selection and app config file downloads.
- **Use when:** Getting a Firebase project and CLI set up.
- **Skip when:** Hosting deploys, Firestore or rules work (use the specific firebase skills).
- **Install:** `npx skills add firebase/agent-skills --skill firebase-basics`
- **Installs:** 172,827

## Mobile

### vercel-react-native-skills — vercel-labs/agent-skills
- **What:** React Native and Expo best practices for performant components, lists, animations and native modules.
- **Use when:** Building React Native or Expo app code.
- **Install:** `npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills`
- **Installs:** 248,211

### react-native-best-practices — callstackincubator/agent-skills
- **What:** Callstack's React Native performance guide: FPS, TTI, bundle size, memory leaks, Hermes, FlashList and jank.
- **Use when:** Profiling or fixing a slow React Native app.
- **Install:** `npx skills add callstackincubator/agent-skills --skill react-native-best-practices`
- **Installs:** 29,563

### expo-native-ui — expo/skills
- **What:** Official Expo skill for native-feeling screens: Apple HIG styling, semantic colors, native controls, SF Symbols and responsive layout.
- **Use when:** Making Expo screens look and feel native.
- **Skip when:** Navigation (`expo-router`) or animation (`expo-animation`), both in expo/skills.
- **Install:** `npx skills add expo/skills --skill expo-native-ui`
- **Installs:** 29,853

### eas-app-stores — expo/skills
- **What:** Builds and submits iOS and Android apps with EAS to TestFlight, the App Store and Google Play, including signing and versioning.
- **Use when:** Shipping a React Native or Expo app to the stores.
- **Install:** `npx skills add expo/skills --skill eas-app-stores`
- **Installs:** 21,707

### swiftui-expert-skill — avdlee/swiftui-agent-skill
- **What:** Writing and refactoring SwiftUI for iOS/macOS: @Observable data flow, composition, layouts, performance, Liquid Glass and API migration.
- **Use when:** Writing new SwiftUI code or migrating to modern APIs.
- **Install:** `npx skills add avdlee/swiftui-agent-skill --skill swiftui-expert-skill`
- **Installs:** 34,670

### swiftui-pro — twostraws/swiftui-agent-skill
- **What:** Paul Hudson's SwiftUI review for modern APIs, maintainability and performance.
- **Use when:** Reviewing an existing SwiftUI project.
- **Install:** `npx skills add twostraws/swiftui-agent-skill --skill swiftui-pro`
- **Installs:** 34,235

### flutter-apply-architecture-best-practices — flutter/agent-plugins
- **What:** Official Flutter guidance for a layered UI/Logic/Data architecture.
- **Use when:** Starting a Flutter project or refactoring one for scale.
- **Install:** `npx skills add flutter/agent-plugins --skill flutter-apply-architecture-best-practices`
- **Installs:** 42,031

## Data & analysis

### data-visualization — anthropics/knowledge-work-plugins
- **What:** Python charting (matplotlib, seaborn, plotly) with chart-type selection and accessible design.
- **Use when:** Producing charts or publication-quality figures from data.
- **Install:** `npx skills add anthropics/knowledge-work-plugins --skill data-visualization`
- **Installs:** 13,485

### build-dashboard — anthropics/knowledge-work-plugins
- **What:** Builds a self-contained interactive HTML dashboard with KPI cards, charts, filters and tables.
- **Use when:** Turning query results into a shareable executive or team snapshot.
- **Install:** `npx skills add anthropics/knowledge-work-plugins --skill build-dashboard`
- **Installs:** 9,000

### data-storytelling — wshobson/agents
- **What:** Turns analysis into a narrative with visualization, context and persuasive structure.
- **Use when:** Presenting analytics to stakeholders or writing a data report.
- **Install:** `npx skills add wshobson/agents --skill data-storytelling`
- **Installs:** 16,608

### jupyter-notebook — openai/skills
- **What:** Creates, scaffolds and edits Jupyter notebooks from bundled templates.
- **Use when:** Setting up a notebook for an experiment, exploration or tutorial.
- **Install:** `npx skills add openai/skills --skill jupyter-notebook`
- **Installs:** 5,519

### using-dbt-for-analytics-engineering — dbt-labs/dbt-agent-skills
- **What:** Official dbt skill for building models with ref()/source(), writing tests and validating with dbt show.
- **Use when:** Any dbt modelling or debugging work.
- **Install:** `npx skills add dbt-labs/dbt-agent-skills --skill using-dbt-for-analytics-engineering`
- **Installs:** 1,123

### hf-cli — huggingface/skills
- **What:** Official Hugging Face Hub CLI skill for models, datasets, Spaces, repos, jobs and cache.
- **Use when:** Downloading, uploading or managing anything on the Hugging Face Hub.
- **Install:** `npx skills add huggingface/skills --skill hf-cli`
- **Installs:** 3,273

### data-analysis — claude-office-skills/skills
- **What:** Analyzes spreadsheet data from Excel or CSV and produces insights, visualizations and reports.
- **Use when:** Someone hands you a spreadsheet and asks "what does this tell us?".
- **Skip when:** The output must be a cleaned or edited workbook (`xlsx`).
- **Install:** `npx skills add claude-office-skills/skills --skill data-analysis`
- **Installs:** 7,750

## Research & writing

### research — mattpocock/skills
- **What:** Investigates a question against high-trust primary sources and saves findings as a Markdown file in the repo.
- **Use when:** Gathering docs or API facts, or delegating reading to a background agent.
- **Install:** `npx skills add mattpocock/skills --skill research`
- **Installs:** 690,053

### last30days — mvanhorn/last30days-skill
- **What:** Researches what people said about a topic in the last 30 days across Reddit, X, YouTube, TikTok, Hacker News, Polymarket, GitHub and the web.
- **Use when:** You need current sentiment or recent discussion, not settled reference facts.
- **Install:** `npx skills add mvanhorn/last30days-skill --skill last30days`
- **Installs:** 49,526

### tavily-best-practices — tavily-ai/skills
- **What:** Reference for building production Tavily integrations for search, extraction, crawling and research in agents and RAG.
- **Use when:** Wiring Tavily web search into an app or agent.
- **Install:** `npx skills add tavily-ai/skills --skill tavily-best-practices`
- **Installs:** 20,238

### firecrawl-deep-research — firecrawl/firecrawl-workflows
- **What:** Produces a long, cited analytical report with multi-angle findings, contrarian views and open questions.
- **Use when:** A complex scientific, technical, policy or market question needs a formal written report.
- **Skip when:** Quick lookups or product picks; it is deliberately heavyweight.
- **Install:** `npx skills add firecrawl/firecrawl-workflows --skill firecrawl-deep-research`
- **Installs:** 35,255

### humanizer — blader/humanizer
- **What:** Rewrites AI-sounding prose to remove common tells (forced triads, dash overuse, stock words, filler) without changing meaning.
- **Use when:** Editing a draft that reads as machine-written.
- **Install:** `npx skills add blader/humanizer --skill humanizer`
- **Installs:** 9,986

### writing-guidelines — vercel-labs/agent-skills
- **What:** Reviews docs and prose for compliance with a writing handbook's voice and tone.
- **Use when:** "Review my docs" or "check writing style".
- **Install:** `npx skills add vercel-labs/agent-skills --skill writing-guidelines`
- **Installs:** 100,468

### doc-coauthoring — anthropics/skills
- **What:** A structured co-writing workflow for proposals, specs and decision docs: transfer context, iterate, then test the doc on readers.
- **Use when:** Drafting a substantial document together with the user.
- **Install:** `npx skills add anthropics/skills --skill doc-coauthoring`
- **Installs:** 92,559

### documentation-writer — github/awesome-copilot
- **What:** Technical documentation written to the Diátaxis framework (tutorials, how-tos, reference, explanation).
- **Use when:** Writing or restructuring software docs.
- **Install:** `npx skills add github/awesome-copilot --skill documentation-writer`
- **Installs:** 27,616

### obsidian-markdown — kepano/obsidian-skills
- **What:** Writes Obsidian-flavored Markdown with wikilinks, embeds, callouts and properties.
- **Use when:** Creating or editing notes in an Obsidian vault.
- **Skip when:** You need to drive the app itself (`obsidian-cli`) or database views (`obsidian-bases`), both in kepano/obsidian-skills.
- **Install:** `npx skills add kepano/obsidian-skills --skill obsidian-markdown`
- **Installs:** 91,279

## Marketing & SEO

### seo-audit — coreyhaines31/marketingskills
- **What:** Audits and diagnoses SEO problems: technical SEO, on-page, meta tags, Core Web Vitals, crawl and indexing issues, traffic drops.
- **Use when:** "Why am I not ranking?" or a site-wide SEO health check.
- **Skip when:** You want an automated crawler with a fix loop (`audit-website`).
- **Install:** `npx skills add coreyhaines31/marketingskills --skill seo-audit`
- **Installs:** 232,527

### copywriting — coreyhaines31/marketingskills
- **What:** Writes or rewrites marketing copy for homepages, landing, pricing and feature pages, including headlines, CTAs and value props.
- **Use when:** Creating new page copy.
- **Skip when:** Tightening copy that already exists (`copy-editing`).
- **Install:** `npx skills add coreyhaines31/marketingskills --skill copywriting`
- **Installs:** 230,000

### copy-editing — coreyhaines31/marketingskills
- **What:** Edits, proofreads and refreshes existing marketing copy.
- **Use when:** "Polish this", "tighten this up" or updating outdated content.
- **Install:** `npx skills add coreyhaines31/marketingskills --skill copy-editing`
- **Installs:** 145,695

### content-strategy — coreyhaines31/marketingskills
- **What:** Plans what content to create: topic clusters, pillars, editorial calendar.
- **Use when:** "What should I write about?" for a blog or content program.
- **Install:** `npx skills add coreyhaines31/marketingskills --skill content-strategy`
- **Installs:** 160,386

### ad-creative — coreyhaines31/marketingskills
- **What:** Generates and iterates ad headlines, descriptions and full variations for any paid platform.
- **Use when:** Producing or testing ad copy at volume (Google RSA, Meta, LinkedIn).
- **Install:** `npx skills add coreyhaines31/marketingskills --skill ad-creative`
- **Installs:** 130,956

### ab-testing — coreyhaines31/marketingskills
- **What:** Plans and designs A/B tests and experimentation programs, including hypotheses, significance and duration.
- **Use when:** Deciding whether and how to test a change.
- **Install:** `npx skills add coreyhaines31/marketingskills --skill ab-testing`
- **Installs:** 74,635

### seo — addyosmani/web-quality-skills
- **What:** Developer-side SEO fixes: meta tags, structured data and sitemaps.
- **Use when:** Implementing SEO improvements in code.
- **Install:** `npx skills add addyosmani/web-quality-skills --skill seo`
- **Installs:** 51,181

### audit-website — squirrelscan/skills
- **What:** Runs the squirrelscan CLI (300+ rules: SEO, performance, security, accessibility) then loops fixing findings in code and re-auditing.
- **Use when:** You want a measured site audit that ends in fixes.
- **Install:** `npx skills add squirrelscan/skills --skill audit-website`
- **Installs:** 73,354

## Sales & business

### sales-enablement — coreyhaines31/marketingskills
- **What:** Creates sales collateral: decks, one-pagers, objection handling docs, demo scripts and battlecards.
- **Use when:** Sales needs material to close deals.
- **Skip when:** You need the actual .pptx file built (pair with `pptx`).
- **Install:** `npx skills add coreyhaines31/marketingskills --skill sales-enablement`
- **Installs:** 116,061

### cold-email — coreyhaines31/marketingskills
- **What:** B2B cold outbound: emails, follow-ups, sending setup, LinkedIn and multichannel cadences, reply handling.
- **Use when:** Writing or fixing an outbound sequence that is not getting replies.
- **Install:** `npx skills add coreyhaines31/marketingskills --skill cold-email`
- **Installs:** 124,951

### revops — coreyhaines31/marketingskills
- **What:** Revenue operations: lead lifecycle, scoring, routing, pipeline stages and marketing-to-sales handoff.
- **Use when:** Leads are not reaching sales or pipeline stages need defining.
- **Install:** `npx skills add coreyhaines31/marketingskills --skill revops`
- **Installs:** 110,928

### sales-discovery-questions — mbfinotti/sales-skills
- **What:** Builds a sequenced discovery question set (pain, root cause, impact, urgency) for a deal or persona, sized to the call.
- **Use when:** Preparing for a discovery or qualification call.
- **Install:** `npx skills add mbfinotti/sales-skills --skill sales-discovery-questions`
- **Installs:** 19,875

### account-research — anthropics/knowledge-work-plugins
- **What:** Researches a target company and contact (news, priorities, ICP fit) and cross-references CRM records.
- **Use when:** "Research [company]" or "who is [person]" before outreach.
- **Install:** `npx skills add anthropics/knowledge-work-plugins --skill account-research`
- **Installs:** 3,324

### call-prep — anthropics/knowledge-work-plugins
- **What:** Pre-call brief with attendees, account history, prior call context and suggested discovery questions.
- **Use when:** "Prep me for my call with [company]".
- **Install:** `npx skills add anthropics/knowledge-work-plugins --skill call-prep`
- **Installs:** 2,954

### review-contract — anthropics/knowledge-work-plugins
- **What:** Reviews a contract against your negotiation playbook, flags deviations and produces redlines with business impact.
- **Use when:** Reviewing vendor or customer agreements clause by clause.
- **Install:** `npx skills add anthropics/knowledge-work-plugins --skill review-contract`
- **Installs:** 3,621

### legal-risk-assessment — anthropics/knowledge-work-plugins
- **What:** Classifies legal risks by severity and likelihood with escalation criteria.
- **Use when:** Deciding whether a matter or deal exposure needs senior or outside counsel.
- **Install:** `npx skills add anthropics/knowledge-work-plugins --skill legal-risk-assessment`
- **Installs:** 5,054

## Product & PM

### grill-me — mattpocock/skills
- **What:** A relentless interview that sharpens a plan or design by questioning it.
- **Use when:** Stress-testing an idea or plan before building.
- **Skip when:** You also want ADRs and a glossary written as you go (`grill-with-docs`).
- **Install:** `npx skills add mattpocock/skills --skill grill-me`
- **Installs:** 1,397,645

### grill-with-docs — mattpocock/skills
- **What:** Same interview as `grill-me`, but records decisions as ADRs and a glossary along the way.
- **Use when:** The grilling should leave documentation behind.
- **Install:** `npx skills add mattpocock/skills --skill grill-with-docs`
- **Installs:** 1,196,990

### to-tickets — mattpocock/skills
- **What:** Breaks a plan or spec into tracer-bullet tickets with explicit blocking edges, locally or in your tracker.
- **Use when:** Turning an agreed plan into an ordered backlog.
- **Install:** `npx skills add mattpocock/skills --skill to-tickets`
- **Installs:** 692,119

### wayfinder — mattpocock/skills
- **What:** Plans work too large for one agent session as a map of decision tickets on your tracker, resolved one by one.
- **Use when:** A big multi-session project needs a shared roadmap.
- **Install:** `npx skills add mattpocock/skills --skill wayfinder`
- **Installs:** 699,444

### prototype — mattpocock/skills
- **What:** Builds a throwaway prototype to answer a design question about state, logic or UI.
- **Use when:** You want to try an idea before committing to a design.
- **Install:** `npx skills add mattpocock/skills --skill prototype`
- **Installs:** 966,204

### brainstorming — obra/superpowers
- **What:** A required ideation step before any creative or new work, in software or not.
- **Use when:** Starting any feature, component or plan from scratch.
- **Install:** `npx skills add obra/superpowers --skill brainstorming`
- **Installs:** 399,111

### prd — github/awesome-copilot
- **What:** Generates Product Requirements Documents with executive summary, user stories, technical spec and risks.
- **Use when:** A formal PRD is the deliverable.
- **Install:** `npx skills add github/awesome-copilot --skill prd`
- **Installs:** 23,934

### write-product-spec — warpdotdev/common-skills
- **What:** Writes a PRODUCT.md behavior spec for a substantial user-facing feature, focused on behavior and validation.
- **Use when:** Defining desired behavior before implementation of an ambiguous feature.
- **Install:** `npx skills add warpdotdev/common-skills --skill write-product-spec`
- **Installs:** 28,422

### sprint-planning — anthropics/knowledge-work-plugins
- **What:** Plans a sprint: scope, capacity (including PTO), goals, P0 vs stretch, carryover.
- **Use when:** Kicking off a sprint or sizing a backlog against the team.
- **Install:** `npx skills add anthropics/knowledge-work-plugins --skill sprint-planning`
- **Installs:** 3,052

## Agent & prompt engineering

### mcp-builder — anthropics/skills
- **What:** Guide for building high-quality MCP servers in Python (FastMCP) or TypeScript (MCP SDK).
- **Use when:** Wrapping an API or service as MCP tools.
- **Skip when:** Building on the mcp-use framework or MCP Apps with UI views (`mcp-apps-builder`).
- **Install:** `npx skills add anthropics/skills --skill mcp-builder`
- **Installs:** 128,900

### mcp-apps-builder — mcp-use/mcp-use
- **What:** Builds, debugs and migrates TypeScript MCP servers and MCP Apps with mcp-use (tools, resources, views, auth).
- **Use when:** You use mcp-use or need MCP Apps with interactive views.
- **Install:** `npx skills add mcp-use/mcp-use --skill mcp-apps-builder`
- **Installs:** 31,999

### claude-api — anthropics/skills
- **What:** Reference for the Claude API and Anthropic SDKs: models, pricing, streaming, tool use, MCP, caching and migration.
- **Use when:** Writing code that calls Claude or choosing a Claude model.
- **Skip when:** The project uses another provider, or a provider-agnostic SDK (`ai-sdk`).
- **Install:** `npx skills add anthropics/skills --skill claude-api`
- **Installs:** 73,051

### ai-sdk — vercel/ai
- **What:** Official Vercel AI SDK help: generateText, streamText, agents, tools, embeddings, structured output and React hooks.
- **Use when:** Building chatbots, agents or RAG in TypeScript across providers.
- **Install:** `npx skills add vercel/ai --skill ai-sdk`
- **Installs:** 67,876

### agents-sdk — cloudflare/skills
- **What:** Builds, debugs and reviews apps on Cloudflare's Agents SDK.
- **Use when:** Running stateful agents on Cloudflare.
- **Install:** `npx skills add cloudflare/skills --skill agents-sdk`
- **Installs:** 101,674

### google-agents-cli-adk-code — google/agents-cli
- **What:** Quick reference for Google's Agent Development Kit: agent types, tools, callbacks, state and the Workflow API.
- **Use when:** Writing agent code with ADK.
- **Install:** `npx skills add google/agents-cli --skill google-agents-cli-adk-code`
- **Installs:** 504,004

### langgraph-fundamentals — langchain-ai/langchain-skills
- **What:** Official LangGraph basics: StateGraph, state schemas, nodes, edges, Command, Send, streaming and errors.
- **Use when:** Writing any LangGraph code.
- **Install:** `npx skills add langchain-ai/langchain-skills --skill langgraph-fundamentals`
- **Installs:** 17,651

### writing-plans — obra/superpowers
- **What:** Turns a spec into a written step-by-step implementation plan before touching code.
- **Use when:** Starting a multi-step task.
- **Install:** `npx skills add obra/superpowers --skill writing-plans`
- **Installs:** 279,159

### dispatching-parallel-agents — obra/superpowers
- **What:** Splits two or more independent tasks across parallel subagents.
- **Use when:** Tasks share no state and can run at the same time.
- **Install:** `npx skills add obra/superpowers --skill dispatching-parallel-agents`
- **Installs:** 215,221

### handoff — mattpocock/skills
- **What:** Compacts the current conversation into a handoff document another agent can pick up.
- **Use when:** Context is running out or work moves to a new session or agent.
- **Install:** `npx skills add mattpocock/skills --skill handoff`
- **Installs:** 1,017,084

### prompt-engineering-patterns — wshobson/agents
- **What:** Prompt design patterns for production LLM apps: templates, chain-of-thought, few-shot, structured prompting and debugging.
- **Use when:** Optimizing or debugging prompts in an application.
- **Install:** `npx skills add wshobson/agents --skill prompt-engineering-patterns`
- **Installs:** 23,210

### caveman — juliusbrussee/caveman
- **What:** A terse response mode that drops filler and keeps every technical fact, to save tokens.
- **Use when:** You want very short answers until you say "stop caveman".
- **Install:** `npx skills add juliusbrussee/caveman --skill caveman`
- **Installs:** 583,291

## Browser & automation

### agent-browser — vercel-labs/agent-browser
- **What:** Browser automation CLI for agents: navigate, fill forms, click, screenshot, extract data, test web apps.
- **Use when:** Any "open this site and do X" task.
- **Skip when:** You only need page content (`firecrawl-scrape`) or are testing your own local app (`webapp-testing`).
- **Install:** `npx skills add vercel-labs/agent-browser --skill agent-browser`
- **Installs:** 1,116,388

### browser-use — browser-use/browser-use
- **What:** Direct browser control over CDP, plus hosted cloud browsers through the browser-use Python library, Playwright or Puppeteer.
- **Use when:** You want CDP-level control or cloud browsers for agents.
- **Install:** `npx skills add browser-use/browser-use --skill browser-use`
- **Installs:** 97,682

### firecrawl-scrape — firecrawl/cli
- **What:** Reads a known page into clean content or structured results through Firecrawl.
- **Use when:** You have the URL and just need its content.
- **Skip when:** You need to discover pages (`firecrawl-search`, `firecrawl-crawl` in the same repo).
- **Install:** `npx skills add firecrawl/cli --skill firecrawl-scrape`
- **Installs:** 83,174

### apify-ultimate-scraper — apify/agent-skills
- **What:** Scrapes data from Instagram, TikTok, YouTube, LinkedIn, X, Google Maps, Reddit and 15+ other platforms with Apify actors.
- **Use when:** Lead generation, brand monitoring or competitor research on social and marketplace platforms.
- **Install:** `npx skills add apify/agent-skills --skill apify-ultimate-scraper`
- **Installs:** 16,130

### chrome-devtools — github/awesome-copilot
- **What:** Browser automation, network analysis and performance profiling through the Chrome DevTools MCP.
- **Use when:** You need DevTools-level insight (network, performance traces) rather than just clicking.
- **Install:** `npx skills add github/awesome-copilot --skill chrome-devtools`
- **Installs:** 15,234

### playwright — openai/skills
- **What:** Automates a real browser from the terminal (navigation, forms, snapshots, extraction) via playwright-cli or a wrapper script.
- **Use when:** You prefer a Playwright-based CLI to drive a browser.
- **Install:** `npx skills add openai/skills --skill playwright`
- **Installs:** 8,311

## Media (image/video/audio)

### remotion-best-practices — remotion-dev/skills
- **What:** Official entry point that routes to all Remotion skills for making videos in React.
- **Use when:** Building programmatic video with Remotion.
- **Install:** `npx skills add remotion-dev/skills --skill remotion-best-practices`
- **Installs:** 648,438

### hyperframes — heygen-com/hyperframes
- **What:** Entry point for HeyGen's HyperFrames HTML video framework: make, edit, animate, validate and render videos, explainers, captions and decks.
- **Use when:** Making video or motion graphics as HTML compositions, or porting from Remotion.
- **Install:** `npx skills add heygen-com/hyperframes --skill hyperframes`
- **Installs:** 1,095,361

### algorithmic-art — anthropics/skills
- **What:** Generative art in p5.js with seeded randomness and interactive parameter exploration.
- **Use when:** Flow fields, particle systems or other code-made art.
- **Install:** `npx skills add anthropics/skills --skill algorithmic-art`
- **Installs:** 87,946

### imagegen — openai/skills
- **What:** Generates or edits raster images (photos, illustrations, sprites, mockups, transparent cutouts), using Codex's built-in image tool or a bundled CLI fallback on the OpenAI API.
- **Use when:** The output should be a bitmap rather than code or vector art, especially inside Codex.
- **Skip when:** Outside Codex you need `OPENAI_API_KEY` for the CLI path; for code-made art use `algorithmic-art` or `canvas-design`.
- **Install:** `npx skills add openai/skills --skill imagegen`
- **Installs:** 5,528

### text-to-speech — elevenlabs/skills
- **What:** Official ElevenLabs text-to-speech for voiceovers and voice apps in 90+ languages.
- **Use when:** Generating spoken audio from text.
- **Install:** `npx skills add elevenlabs/skills --skill text-to-speech`
- **Installs:** 15,789

### speech-to-text — elevenlabs/skills
- **What:** Transcribes audio or video to text with ElevenLabs Scribe, including subtitles.
- **Use when:** Transcribing meetings or producing captions with ElevenLabs.
- **Install:** `npx skills add elevenlabs/skills --skill speech-to-text`
- **Installs:** 11,072

### transcribe — openai/skills
- **What:** Transcribes audio files through the OpenAI API (gpt-4o transcribe models) with optional diarization and known-speaker hints; needs `OPENAI_API_KEY`.
- **Use when:** You need speaker labels in interviews or meetings using OpenAI models.
- **Install:** `npx skills add openai/skills --skill transcribe`
- **Installs:** 3,797

### ffmpeg — digitalsamba/claude-code-video-toolkit
- **What:** FFmpeg recipes for conversion, resizing, compression and audio extraction.
- **Use when:** Any quick media transformation, such as GIF to MP4 or extracting an audio track.
- **Install:** `npx skills add digitalsamba/claude-code-video-toolkit --skill ffmpeg`
- **Installs:** 11,108

### excalidraw-diagram-generator — github/awesome-copilot
- **What:** Generates .excalidraw diagrams (flowcharts, mind maps, architecture) from plain-language descriptions.
- **Use when:** You want an editable hand-drawn-style diagram file.
- **Install:** `npx skills add github/awesome-copilot --skill excalidraw-diagram-generator`
- **Installs:** 31,467

## Meta: finding & making skills

### find-skills — vercel-labs/skills
- **What:** Searches the skills ecosystem and installs a skill when the user asks "is there a skill for X" or "how do I do X".
- **Use when:** A capability might already exist as an installable skill.
- **Install:** `npx skills add vercel-labs/skills --skill find-skills`
- **Installs:** 3,951,121

### skill-creator — anthropics/skills
- **What:** Creates and improves skills, runs evals, benchmarks performance and tunes descriptions for better triggering.
- **Use when:** Authoring a new skill or measuring whether an existing one works.
- **Install:** `npx skills add anthropics/skills --skill skill-creator`
- **Installs:** 410,458

### writing-skills — obra/superpowers
- **What:** Superpowers' method for creating, editing and verifying skills before deployment.
- **Use when:** You follow the superpowers workflow and are writing a skill.
- **Install:** `npx skills add obra/superpowers --skill writing-skills`
- **Installs:** 214,519

### plugin-structure — anthropics/claude-code
- **What:** Claude Code plugin layout: plugin.json, `${CLAUDE_PLUGIN_ROOT}`, commands, agents, skills, hooks and auto-discovery.
- **Use when:** Packaging skills, agents or hooks as a Claude Code plugin.
- **Install:** `npx skills add anthropics/claude-code --skill plugin-structure`
- **Installs:** 13,704

### agent-development — anthropics/claude-code
- **What:** Writing Claude Code subagents: frontmatter, descriptions, tools, system prompts and triggering conditions.
- **Use when:** Creating a custom subagent for a plugin or project.
- **Install:** `npx skills add anthropics/claude-code --skill agent-development`
- **Installs:** 19,430

### skill-writer — getsentry/skills
- **What:** Synthesizes sources into a skill following the Agent Skills spec and improves it from positive and negative examples.
- **Use when:** Turning docs or examples into a maintained skill with validation.
- **Install:** `npx skills add getsentry/skills --skill skill-writer`
- **Installs:** 2,341
