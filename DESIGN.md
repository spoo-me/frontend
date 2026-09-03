---
name: spoo.me landing
description: Neutral instrument chassis where color only appears as live signal — the marketing surface for spoo.me's analytics-led link platform.
colors:
  aurora-violet: "oklch(0.606 0.25 292.717)"
  aurora-violet-light: "oklch(0.541 0.281 293.009)"
  live-emerald: "oklch(0.765 0.177 163.223)"
  live-emerald-light: "oklch(0.596 0.145 163.225)"
  ink: "oklch(0.985 0 0)"
  muted-ink: "oklch(0.708 0 0)"
  background: "oklch(0.145 0 0)"
  canvas: "oklch(0.115 0 0)"
  shell: "oklch(0.175 0 0)"
  surface: "oklch(0.205 0 0)"
  hairline: "oklch(1 0 0 / 10%)"
  background-light: "oklch(1 0 0)"
  ink-light: "oklch(0.145 0 0)"
  destructive: "oklch(0.704 0.191 22.216)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1rem + 5vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  serif-accent:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontWeight: 400
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.16em"
  dense:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.125rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    height: "36px"
    padding: "0 10px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "36px"
    padding: "0 10px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "36px"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: spoo.me landing

## 1. Overview

**Creative North Star: "The Signal Layer"**

The system is a neutral instrument chassis on which color is reserved for signal. The entire surface — backgrounds, cards, controls, navigation — is a pure zero-chroma gray ramp, dark by default. Against that field, exactly two hues are permitted to speak: Aurora Violet where the brand comes alive (auroras, charts, rare emphasis), and Live Emerald where something is actually live (status, success, real-time activity). The visual claim mirrors the strategic one in PRODUCT.md: *"show the analytics, don't claim them"* — data is the only thing colorful enough to notice, so the analytics are what the eye finds.

The finish is machined, not decorated. Depth comes from hairline rings fused with soft, layered shadows; controls are beveled with inset highlights and physically depress one pixel on press; engineering textures (24px dot grids, diagonal hatching) mark gutters and structural zones. The voice is confident, polished, approachable — a serious product company, never a hobby project. The one flourish the system allows itself is typographic: an Instrument Serif italic phrase set inside a Geist headline, muted rather than loud.

This system explicitly rejects the Dub.co minimal black-and-white lookalike, hobby/side-project energy, and the terminal-and-code-everywhere developer costume. Mono type exists here only as an 11px micro-label discipline, not as an aesthetic.

**Key Characteristics:**
- Zero-chroma neutral ramp; color appears only as signal (violet = brand, emerald = live)
- Dark-mode default with a full light counterpart; theme switch is a 240ms whole-page cross-fade
- Hairline rings + soft stacked shadows carry all depth
- Tactile, machined controls (gradient bevel, inset highlight, 1px press)
- Geist everywhere, with Instrument Serif italic as the single display flourish and Geist Mono locked to micro-labels

## 2. Colors

A monochrome instrument field with two locked signal hues; nothing else may carry chroma except chart inks.

### Primary
- **Aurora Violet** (oklch(0.606 0.25 292.717) dark / oklch(0.541 0.281 293.009) light): the brand's voice. Appears in aurora glows, chart accents, and rare moments of emphasis. Near gamut-edge chroma used at minimum frequency — its rarity is what makes it read as premium.

### Secondary
- **Live Emerald** (oklch(0.765 0.177 163.223) dark / oklch(0.596 0.145 163.225) light): strictly semantic. Live status, success, real-time activity. Never decorative, never brand emphasis.

### Neutral
- **Ink** (oklch(0.985 0 0) dark theme / oklch(0.145 0 0) light theme): headings and primary text; also the fill of primary buttons.
- **Muted Ink** (oklch(0.708 0 0) dark / oklch(0.556 0 0) light): body copy, supporting text, the serif italic display phrase.
- **Background** (oklch(0.145 0 0) dark / oklch(1 0 0) light): the page field.
- **Canvas / Shell** (oklch(0.115 0 0) / oklch(0.175 0 0) dark): app-chrome layers — canvas is the layer a floating content sheet sits on, shell is the sheet.
- **Surface** (oklch(0.205 0 0) dark): cards and popovers.
- **Hairline** (oklch(1 0 0 / 10%) dark / oklch(0.922 0 0) light): borders, rings, dividers, and the ink for dot/hatch patterns.

### Named Rules
**The Accent Lock Rule.** Violet is brand (aurora, charts, rare emphasis); emerald is live/success semantics only. No third hue may appear outside the chart ink ramp, and the two never trade jobs. One named exception, the Aurora: the hero glow may layer adjacent-hue blobs (indigo, rose) around the violet core; nowhere else.

**The Monochrome Controls Rule.** Primary actions are ink-colored, not violet. The brand color never fills a button; conviction is carried by contrast and bevel, not hue.

## 3. Typography

**Display Font:** Geist (with ui-sans-serif, system-ui fallback)
**Body Font:** Geist (same family, lighter weights)
**Serif Accent:** Instrument Serif 400 italic
**Label/Mono Font:** Geist Mono

**Character:** One geometric-precise sans doing nearly all the work, with a single romantic interruption — an Instrument Serif italic phrase set muted inside a bold headline. Confident without shouting; the serif keeps it approachable.

### Hierarchy
- **Display** (600, clamp ~2.25rem→4.5rem across breakpoints, tight tracking −0.025em, `text-balance`): hero headlines. The signature move is a muted Instrument Serif italic span inside the semibold Geist line ("The link platform with *analytics worth paying for.*").
- **Headline** (600, 1.5rem, −0.015em): section and article headings.
- **Body** (400, 1rem–1.125rem, 1.6–1.8 line-height): muted-ink paragraphs, max ~65ch (`max-w-xl` in heroes).
- **Label** (500, 11px, +0.16em, UPPERCASE, Geist Mono): the `label-mono` utility — the one way small caps labels are set, everywhere.
- **Dense** (400, 13px): code samples and data-dense demo panels only; never running body copy. (Sub-11px sizes are permitted solely inside miniaturized product mockups, where true scale would break the illusion.)

### Named Rules
**The One Label Rule.** `label-mono` (Geist Mono 11px / 500 / 0.16em / uppercase) is the only permitted micro-label treatment. No ad-hoc tracked-caps text, and mono never expands beyond labels and code into an aesthetic.

**The One Flourish Rule.** Instrument Serif appears only as an italic, muted phrase within a display heading — and on any single page, only in the hero and the closing CTA. It never sets whole headings, body copy, or UI text.

## 4. Elevation

Depth is hairline-fused: every shadow ships welded to a 1px ring or border, and neither carries depth alone. Surfaces also step tonally (canvas → shell → surface in dark mode), so elevation reads even where shadows are invisible on near-black. In dark mode, shadows largely give way to tonal steps and inset top highlights (`inset 0 1px 0 rgba(255,255,255,0.03)`); in light mode the soft stacked shadows do the work.

### Shadow Vocabulary
- **Soft** (`0 1px 2px rgb(0 0 0 / 0.06), 0 3px 6px -3px rgb(0 0 0 / 0.08)`): controls — the tactile "modern SaaS button" edge on inputs and small elements.
- **Card** (`0 1px 2px rgb(0 0 0 / 0.03), 0 8px 16px -4px rgb(0 0 0 / 0.04), 0 24px 48px -12px rgb(0 0 0 / 0.07)`): card-tier definition plus large diffused lift, fused with hairlines.
- **Float** (`0 1px 2px rgb(0 0 0 / 0.05), 0 8px 20px -6px rgb(0 0 0 / 0.1)`): demo artifacts hovering over marketing canvases.
- **Float-sm** (`0 1px 2px rgb(0 0 0 / 0.04), 0 4px 10px -4px rgb(0 0 0 / 0.08)`): smaller floating fragments.

### Named Rules
**The Hairline Fusion Rule.** A shadow without a ring is forbidden, and a heavy shadow is always wrong: if an element looks like it's floating off a 2014 dashboard, the shadow is doing a hairline's job.

## 5. Components

Tactile and machined: controls feel physically made — beveled, inset-lit, and they depress on press.

### Buttons
- **Shape:** gently rounded (10px, `rounded-lg`), 36px default height (hero CTAs 40px). One control height: inputs, selects, date fields and buttons that stand on their own are all 36px, carried by the primitives, never by a per-site `h-*`. The compact `sm` tier (28px) exists only for labelled actions inside list rows and as icon-only row actions; floating action pills use the standard height
- **Primary:** the Kumo bevel recipe — vertical gradient from ink+15% white to ink, 1px inset top highlight at +30% white, ring at −10% black; hover brightens the gradient start. In dark mode the near-white primary flips the bevel downward (gradient to −12% black, no inset highlight).
- **Press / Focus:** `active:translate-y-px` — every button physically depresses 1px; focus is a 3px `ring/50` halo with border shift.
- **Outline:** hairline border, transparent fill, muted hover fill. **Ghost:** no chrome until hover. **Destructive:** tinted `destructive/10` fill, never solid red.

### Cards / Containers
- **Corner Style:** 14px (`rounded-xl`)
- **Background:** surface (`--card`), sitting on canvas/shell tonal steps
- **Shadow Strategy:** `ring-1 ring-foreground/10` fused with the card shadow tier (see Elevation)
- **Internal Padding:** 16px default, 12px small variant; images bleed full-width to the card edge

### Inputs / Fields
- **Style:** transparent field, hairline `border-input`, 10px radius, 36px height, soft shadow; dark mode adds `bg-input/30` plus a 1px inset top light
- **Focus:** border takes the ring color + 3px `ring/50` halo (same grammar as buttons)
- **Error:** `aria-invalid` swaps border and halo to destructive tints

### Navigation
- Ink links on the neutral field with muted hover states; icon boxes may carry the `shimmer-border` conic sheen (static, on opposing corners). The command menu (⌘K) is a first-class nav surface.

### Textures (signature)
- **Dot grid** (`pattern-dots`): 1px hairline dots on a 24px grid — single systematized size; callers control opacity and masking.
- **Diagonal hatch** (`pattern-hatch`): engineering-drawing gutter texture, 1px hairlines every 7px at −45°.

### Chart Motion (signature)
Charts announce data, not themselves: a 700ms left-to-right `clip-path` draw reveal (ease-out cubic, 150ms head start), with a rise-from-baseline amplitude variant. Marquees, shimmer text, and blink cursors exist as systematized keyframes; reduced-motion alternatives are required.

## 6. Do's and Don'ts

### Do:
- **Do** keep the surface zero-chroma; when a screen needs energy, reach for Aurora Violet in a chart, glow, or single emphasis — never a broad fill.
- **Do** fuse every shadow with a 1px ring (`ring-foreground/10` or `border-input`) and pick from the four named shadow tiers only.
- **Do** use the Kumo bevel recipe and 1px press for anything clickable that matters; tactility is the brand's polish made physical.
- **Do** set every micro-label with `label-mono` and every display flourish with the muted Instrument Serif italic span — one system, no variants.
- **Do** show product-real UI (dashboard fragments, live charts, the instant shortener) as proof, floating on `shadow-float` over the marketing canvas.
- **Do** provide `prefers-reduced-motion` alternatives for every animation (marquee, chart draw, particles, globe).

### Don't:
- **Don't** build a Dub.co lookalike — their minimal black-and-white aesthetic is a named anti-reference; this system's identity is the signal-on-neutral lock plus machined tactility, not generic minimal dark.
- **Don't** let anything read as hobby/side-project energy: no GitHub-readme vibes, no default-Tailwind look, no badge walls. Every surface must survive the arrival of paid plans.
- **Don't** wear the terminal-and-code-everywhere costume. Code appears where developers genuinely look (API sections, docs links), rendered through Shiki, and nowhere else.
- **Don't** fill buttons or large surfaces with Aurora Violet, and never use Live Emerald decoratively — the Accent Lock Rule is absolute.
- **Don't** use gradient text, colored side-stripe borders, glassmorphism-as-default, or arbitrary z-index values (the semantic scale exists).
- **Don't** invent a fifth shadow, a second label style, a third hue, or a new dot-grid size. The system's power is that each job has exactly one tool.
