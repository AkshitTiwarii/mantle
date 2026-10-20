---
name: Mantle
description: Everything that customizes Claude, in one place, laid out as an architect's catalogue sheet.
colors:
  bg: "#fcfaf4"
  bg-2: "#f8f4ea"
  gutter: "#f6f3ea"
  panel: "#ffffff"
  panel-2: "#fdfbf6"
  panel-3: "#f4f1ea"
  line: "#ebe6db"
  line-2: "#dcd6c9"
  frame: "#d6d1c6"
  text: "#0a0a0a"
  text-2: "#3a3a3a"
  muted: "#625d53"
  faint: "#78726a"
  green: "#10b981"
  green-600: "#059669"
  green-700: "#15803d"
  green-900: "#065f46"
  mint: "#e8f3ef"
  mint-2: "#f2f9f4"
  t-theme: "#7d5f8b"
  t-skill: "#1f8a70"
  t-connector: "#3f6f95"
  t-plugin: "#94691a"
  warn: "#8a5d0c"
  err: "#a8452f"
typography:
  display:
    fontFamily: "Instrument Serif, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(42px, 6.4vw, 84px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "0.015em"
  headline:
    fontFamily: "Instrument Serif, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(32px, 4vw, 50px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "0.015em"
  title:
    fontFamily: "Instrument Serif, Iowan Old Style, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0.01em"
  title-sans:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(16px, 1.4vw, 18.5px)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  command:
    fontFamily: "JetBrains Mono Variable, Cascadia Code, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono Variable, Cascadia Code, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "10.5px"
    fontWeight: 600
    letterSpacing: "0.06em"
rounded:
  sm: "8px"
  field: "9px"
  btn: "10px"
  card: "14px"
  bento: "18px"
  plate: "24px"
  pill: "999px"
spacing:
  frame-x: "clamp(10px, 4vw, 72px)"
  sheet-inset: "clamp(16px, 4vw, 56px)"
  band: "clamp(56px, 8vw, 96px)"
  grid-gap: "18px"
  card-pad: "16px 18px"
  control-gap: "10px"
components:
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.panel}"
    typography: "{typography.title-sans}"
    rounded: "{rounded.btn}"
    padding: "10px 17px"
  button-primary-hover:
    backgroundColor: "{colors.green-700}"
    textColor: "{colors.panel}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.btn}"
    padding: "10px 17px"
  button-secondary-hover:
    textColor: "{colors.green-900}"
  button-ghost:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.btn}"
    padding: "10px 17px"
  button-lg:
    rounded: "11px"
    padding: "13px 22px"
  button-sm:
    rounded: "{rounded.sm}"
    padding: "6px 11px"
  install-line:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-2}"
    typography: "{typography.command}"
    rounded: "{rounded.pill}"
    padding: "7px 8px 7px 14px"
  segmented:
    backgroundColor: "{colors.panel-3}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "3px"
  segmented-selected:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  search-input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  specimen-plate:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.plate}"
    padding: "12px"
  badge:
    backgroundColor: "{colors.panel-3}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  badge-mantle:
    backgroundColor: "{colors.text}"
    textColor: "{colors.panel}"
  badge-verified:
    backgroundColor: "{colors.mint-2}"
    textColor: "{colors.green-900}"
  toast:
    backgroundColor: "{colors.text}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
---

# Design System: Mantle

## Overview

**Creative North Star: "The Architect's Catalogue Sheet"**

Mantle is drawn as one sheet of cream drafting paper pinned inside a ruled frame. The paper sits between two 1px side rules; outside them the gutter is a warm off-white woven with two faint crossing diagonals, like the cloth a mantle is cut from, so the page always reads as an object laid on a table rather than a full-bleed screen. Sections are not separated by colored bands but by full-bleed rules that cross paper and gutter alike, with small stitched diamonds in green-900 where each rule meets the frame. The visual language is the user's ZeroCarbon site carried into a product gallery: Instrument Serif display with one italic green phrase, Inter for reading, JetBrains Mono only where something is a command, a value or a badge.

The paper is quiet on purpose. The only saturated color in the system belongs to the thing being sold: Mantle's themes, shown as dark specimen plates set in white mats, like prints in a catalogue. Chrome stays ink, cream and one green. This refuses the dark neon AI-tool default outright; the dark surfaces that do exist are specimens, the ink button and the toast, never page chrome.

Motion is borrowed from the Aceternity / 21st.dev component vocabulary and kept purposeful: the hero plate steps through Claude's live states, the navbar contracts into a floating pill on scroll, catalog marquees drift slowly, and a white pill slides between segmented options. Everything settles on one long-tailed ease and stops entirely under reduced motion.

**Key Characteristics:**
- Cream paper inside a ruled frame on a woven crosshatch gutter; light-only.
- Full-bleed rules with stitched green diamonds divide sections.
- Serif display (weight 400) with an italic green-700 accent phrase; Inter body; mono for data only.
- Ink-black primary buttons that turn deep green (green-700 to green-900) on hover; cream-gradient secondary buttons.
- White cards on hairlines that lift on hover.
- Theme previews are the only saturated color, presented as dark plates in white mats.

## Colors

A warm paper-and-ink palette with a single green voice; all saturation is quarantined inside the theme specimens.

### Primary
- **Drafting Green** (green-700): The system's voice. Italic accent words in serif headlines, the focus ring, hover borders on secondary buttons and inputs, the `>` prompt in the install line, footer link hover, checkbox accent.
- **Deep Forest** (green-900): Diamond marks on rules, text on verified/on badges, secondary button hover text.
- **Signal Emerald** (green) and **Emerald Shade** (green-600): Indicators and fills, not text grounds: the online companion dot (with a 3px 18% halo), the make-a-theme plus tile on hover, the moving-border glow on the closing CTA.
- **Mint Wash** (mint) and **Mint Paper** (mint-2): The 3–4px focus halo around inputs and search; verified badge ground.

### Secondary
Four muted categorical hues tag catalog types and nothing else: **Plum Dusk** (t-theme), **Herbarium Teal** (t-skill), **Blueprint Slate** (t-connector), **Brass Ochre** (t-plugin). They appear as type pills and 40px type icons, drawn in `currentColor` with a 7–9% tint fill and a 22–35% tint border.

### Neutral
- **Cream Paper** (bg): The sheet itself, inside the frame.
- **Woven Gutter** (gutter): Outside the frame, under two crossing `repeating-linear-gradient(±45deg, rgba(28,27,24,0.035) 0 1px, transparent 1px 7px)` hatches.
- **Deep Paper** (bg-2): Wells for commands and code: copy fields, `pre.code`, hex inputs, install command rows.
- **Card White** (panel): Cards, plates' mats, bento cells, inputs, the segmented pill.
- **Warm White** (panel-2) and **Sunken Paper** (panel-3): Popovers, the make-your-own card, segmented track, tags, inline code, paper bento art.
- **Hairline** (line), **Firm Hairline** (line-2), **Frame Rule** (frame): Card borders at rest, card borders on hover and input borders, the sheet's side rules and section rules.
- **Ink** (text), **Graphite** (text-2), **Stone** (muted), **Pencil** (faint): Headings and primary text, body and ledes, secondary meta, hints and counts.
- **Ochre Warning** (warn) and **Brick Error** (err): Placeholder badges and warnings on a `#fbf3e2` wash; invalid hex fields and error toasts.

### Named Rules
**The Specimen Rule.** Saturated color appears only inside a theme preview (terminal, chat and Windows Terminal mocks, palette chips, state swatches). App chrome uses ink, paper and green.

**The One Green Rule.** Green-700 is the only accent that carries meaning in chrome. Brighter greens mark status and glow; they never sit under text.

**The Type-Hue Rule.** The four `t-*` hues label catalog types only, always as tinted pills or icons, never as fills for buttons or sections.

## Typography

**Display Font:** Instrument Serif (with Iowan Old Style, Georgia)
**Body Font:** Inter Variable (with system-ui sans)
**Label/Mono Font:** JetBrains Mono Variable (with Cascadia Code, ui-monospace)

**Character:** A drafting-table pairing: a slender, slightly condensed serif sets the voice at weight 400 only, with balanced wrapping and a hair of positive tracking, while Inter does the reading and JetBrains Mono marks anything that could be pasted or measured.

### Hierarchy
- **Display** (400, clamp(42px, 6.4vw, 84px), 1.02): Hero headline, max 15ch, centered. The closing CTA uses the same face at clamp(44px, 6.5vw, 88px); page heads at clamp(42px, 5.2vw, 68px).
- **Headline** (400, clamp(32px, 4vw, 50px), 1.08): Section heads, max 16ch; centered section heads run to clamp(36px, 5vw, 64px). Gallery sub-heads 32px; panel heads 26px.
- **Title** (serif 400, 25–28px): Theme card names, bento cell titles, the make-your-own card, the empty state line, the plate caption name (22px).
- **Title Sans** (Inter 600, 16.5px, -0.01em): Item card names and other h3s that are labels rather than voice.
- **Lede** (Inter 400, clamp(16px, 1.4vw, 18.5px), 1.55): Under display and page headlines, max 58ch, in Graphite.
- **Body** (Inter 400, 15px, 1.6): Default text; supporting paragraphs cap at 46–52ch. Card taglines 14px, meta 12.5–13.5px.
- **Command** (Mono 12.5px): Install lines, copy fields, code blocks. Inline code sits at 0.86em in a Sunken Paper chip.
- **Label** (Mono 600, 10.5px, 0.06em, uppercase): Status badges and the dark/light mode tag. State pills use mono 11.5px lowercase.

### Named Rules
**The Italic Accent Rule.** A serif headline may carry one italic phrase in green-700, at its end ("in one place.", "yours."). Never more than one, never in body text.

**The Mono-Is-Data Rule.** JetBrains Mono is reserved for commands, values, live-state names and badges. Headings and prose are never mono.

**The Light Serif Rule.** Instrument Serif is set at 400 only; emphasis comes from italic and green, never weight.

## Layout

The page is a single centered sheet: `.sheet` sits inside a side margin of clamp(10px, 4vw, 72px) (frame-x) with 1px Frame Rule borders, and its content is inset again by clamp(16px, 4vw, 56px). Sections ("bands") breathe at clamp(56px, 8vw, 96px) vertical padding; the hero opens at clamp(56px, 9vw, 112px) and the closer at clamp(72px, 10vw, 128px). Between every band runs a full-bleed `.rule` that extends through the gutters to the viewport edges, with an 8px diamond (a square rotated 45°, 1.5px green-900 border, paper fill) centered on each frame intersection.

The first viewport is centered: serif headline, lede, black primary and cream secondary CTA (10px gap, 32px above), the copyable install line, then a specimen plate up to 1120px wide. Section heads use a two-column grid (headline left, paragraph right, aligned to the baseline end) that collapses to one column below 1060px. Galleries use auto-fill grids with an 18px gap: theme cards min 340px, item cards min 300px. The bento uses three columns from md with 21rem rows.

Breakpoints are observed at 1060px (detail and maker grids stack; section heads stack), 1024px (desktop navbar to mobile nav), 768px (bento to three columns) and 720px (hero plate stacks terminal over chat and drops the Windows Terminal mock; footer stacks). Below 720px the side gutters shrink toward 10px and the inner inset toward 16px.

**The Ruled Sheet Rule.** Sections are divided by full-bleed rules with stitched diamond marks, never by alternating background bands.

## Elevation & Depth

Hybrid and restrained. Surfaces sit flat on hairlines at rest; depth is earned by state. Cards, bento cells and marquee cards gain a soft warm-black shadow on hover (cards also rise 3px). Only objects that float above the sheet carry the large shadow at rest: the hero specimen plate, the install popover and the modal. Inside the plates, the mock windows carry their own darker drop shadow because they belong to the specimen, not the paper.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 10px 35px -10px rgba(28,27,24,0.12), 0 1px 2px rgba(28,27,24,0.05)`): Hover state for cards, bento cells, marquee cards.
- **Float** (`box-shadow: 0 30px 80px -20px rgba(28,27,24,0.18), 0 0 0 1px rgba(28,27,24,0.06)`): Specimen plate, popover, modal.
- **Ink Bevel** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.18)`): Primary button at rest.
- **Seat** (`box-shadow: 0 1px 3px rgba(28,27,24,0.12), 0 0 0 1px rgba(28,27,24,0.05)`): The sliding segmented pill.
- **Navbar Pill** (Aceternity's stacked ambient shadow with 10px backdrop blur on `rgba(255,255,255,0.8)`): Only when the navbar has contracted on scroll.

**The Flat-At-Rest Rule.** Paper surfaces have no shadow until hovered, focused or floating; hairlines do the structural work.

## Shapes

Soft, consistent rounding with pills for controls. Fields and small wells take 9px, buttons 10px (8px small, 11px large), cards 14px, bento cells and the modal 18px, the hero plate's mat 24px with a 16px stage inside, theme card stages 9px inside an 8px mat. Every selector-style control is a full pill (999px): segmented filters, search, install line, state pills, tags, badges, toasts. Swatch buttons in the plate caption are 26px circles with a 2px white ring. Borders are always 1px hairlines; the only dashed border is the make-your-own card, which reads as an empty slot in the catalogue.

**The Mat Rule.** A theme preview is always inset in a white mat (8–12px) with its own smaller radius, never bled to a card edge.

## Components

### Buttons
Tactile and confident, with a pressed 1px drop on `:active` and 0.25s transitions on the long-tailed ease.
- **Shape:** gently rounded (10px; 8px small; 11px large).
- **Primary:** an ink gradient (`#2a2a2a` to `#0a0a0a`) with white 14px/600 text and the Ink Bevel shadow; 10px 17px padding (13px 22px large). On hover it turns deep green (`#15803d` to `#065f46`), keeping white text above 5:1.
- **Secondary:** a cream gradient (`#fff` → `#fbf9f6` → `#f3f0ea`) with a `#e2dfd7` hairline and Ink text; hover shifts the border to green-700 and the text to green-900.
- **Ghost:** transparent with a Firm Hairline border and Graphite text; hover fills Card White. Used for Copy and Clear filters.
- **Focus:** 2px green-700 outline at 2px offset, sitewide.
- **Moving-border CTA:** the closing "Copy install command" uses Aceternity's moving border: an ink button whose border carries a travelling emerald radial glow (3.2s loop). One per page, at the close.

### Install Line
The copyable command under the hero CTAs: a translucent white pill (70%) on a hairline, mono 12.5px Graphite, a green-700 `>` prompt, the command scrolling horizontally without a scrollbar, and a small ghost Copy button inside. Clicking anywhere copies and raises a toast.

### Chips
- **Type pills:** `currentColor` text in a type hue with a 7% tint fill and 35% tint border, 12px/600, with a 13px type icon.
- **Badges:** mono uppercase labels. Default on Sunken Paper; Mantle badge inverts to ink; Public repo and on-states use Mint Paper with green-900; Placeholder uses the ochre warning wash.
- **Tags and counts:** 12px on Sunken Paper pills; counts use tabular numbers on a 6% ink wash.
- **State pills:** mono 11.5px lowercase on Warm White with a 7px state swatch; the selected pill takes an Ink border.

### Cards / Containers
- **Corner Style:** 14px (cards), 18px (bento), 24px (plate).
- **Background:** Card White on a Hairline border; the make-your-own card uses Warm White with a dashed Firm Hairline border and a 56px ink plus tile that turns green and rotates 90° on hover.
- **Shadow Strategy:** Flat at rest; Lift plus a 3px rise on hover or focus-within (see Elevation).
- **Theme cards:** an 8px mat around a 16:10 dark specimen stage, a 6px palette strip, the name in serif 25px and a mono uppercase dark/light tag.
- **Item cards:** 16px 18px body, 40px tinted type icon, Inter 600 name, 14px Graphite tagline, install button in the footer.
- **Internal Padding:** 16–18px; panels 20px 22px.

### Inputs / Fields
- **Style:** Card White, Firm Hairline border, 9px radius, 8px 10px padding. Search is a 999px pill with a leading 16px icon.
- **Focus:** border shifts to green-700 with a 3–4px Mint Wash halo.
- **Error / Disabled:** invalid hex fields take a Brick Error border; disabled buttons drop to 50% opacity.

### Navigation
Aceternity's resizable navbar, dressed for the sheet. At the top it spans the frame transparently: the brand (30px ink mark plus "Mantle" in serif 24px), centered links in Graphite 14px with a Sunken Paper hover pill that slides between items, a companion status dot, a transparent GitHub button and an ink "Install Mantle" button. After 100px of scroll it springs (stiffness 200, damping 50) to 40% width, drops 20px, and becomes a blurred 80% white pill with the stacked navbar shadow. Below 1024px it becomes a mobile header with a toggle that opens a white menu sheet.

### Segmented Control
Filters as a pill track (Sunken Paper, 3px padding, Hairline border). Options are 13.5px/500 Stone text; the selected option is marked by a white pill that slides between options with motion's shared `layoutId` (spring 380 / 32) and seats with the Seat shadow.

### Specimen Plate (signature)
The hero figure: a 12px white mat at 24px radius with the Float shadow around a 16:8.6 stage whose background is a radial gradient of the selected palette. Terminal, chat and Windows Terminal mocks overlap inside it. The caption row holds circular palette chips (diagonal three-color split, selected ring in Ink, 1.12 scale), the palette name in serif 22px with an italic Stone state, and the state pills. The plate cycles idle, thinking, working, plan, done and error every 1.5s and pauses on hover or on a manual pick.

### Catalog Marquee
Two rows of real catalog entries in 320px white cards drifting in opposite directions (80s per loop at "slow"), edge-masked with a 12% fade and paused on hover.

### Toast
Ink pill, white 14px/600, bottom-center, rising in over 0.3s; errors switch the ground to Brick Error.

## Do's and Don'ts

### Do:
- **Do** keep every page inside the ruled sheet: cream paper, 1px Frame Rule sides, hatched gutter outside.
- **Do** separate sections with full-bleed rules carrying green-900 diamond marks at the frame.
- **Do** end a serif headline with at most one italic green-700 phrase.
- **Do** show themes as dark specimens inset in a white mat (8–12px), with their palette chips and live-state pills beside them.
- **Do** set commands, values, state names and badges in JetBrains Mono, and make every install command copyable in one click.
- **Do** keep surfaces flat on hairlines at rest and lift them (Lift shadow, 3px rise) only on hover or focus.
- **Do** keep text on green at 4.5:1 or better: white labels sit on green-700, not on the brighter emeralds.
- **Do** honor `prefers-reduced-motion` by stopping all animation and transition.

### Don't:
- **Don't** make page chrome dark or neon; dark belongs to specimen plates, the ink button and toasts only.
- **Don't** put saturated color outside a theme preview, or use the `t-*` type hues for anything but type pills and icons.
- **Don't** set headings or prose in mono, or the serif at any weight above 400.
- **Don't** divide sections with alternating background bands; use the rule.
- **Don't** add `dark:` variants; the sheet is light-only.
- **Don't** add eyebrow labels or kickers above headlines.

## Wallpapers

Every theme preview sits on a wallpaper: the stage is the image itself, dimmed 22%, with the mock windows on top. Terminal mocks wash the image under 68% of the theme's background (what Windows Terminal's background-image opacity does); the claude.ai mock blurs it (3px, 62% brightness) behind glass panels mixed from the surface colors. Each theme has a matched wallpaper (`pairs`), the visitor can pick another or attach their own (an object URL, never uploaded), and the choice applies to every preview on the site. Wallpaper cards credit author and license under the image; CC BY / BY-SA credits are required, never optional.
