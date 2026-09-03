# spoo-landing

Marketing site for spoo.me. See README.md for stack and layout.

## Design Context

Before any design or UI work, read:

- **PRODUCT.md** — strategy: register (brand), audience, analytics-led positioning, belief ladder, anti-references (no Dub.co lookalike, no hobby energy, no terminal costume), and the five design principles.
- **DESIGN.md** — the visual system: "The Signal Layer" north star, the Accent Lock (violet = brand signal, emerald = live semantic, everything else zero-chroma), hairline-fused elevation, the Kumo button bevel, `label-mono` micro-labels, and the Instrument Serif display flourish.
- `.impeccable/design.json` — machine-readable tokens and component snippets (regenerate alongside DESIGN.md).

Every new surface must satisfy both files; when they conflict with convenience, the files win.

## Controls

Every standalone input, select, date field and button in the dashboard is 36px, and only the `components/ui` primitives carry that height. Never pass `h-*` or `size="sm"` per site; `components/ui/control-heights.test.ts` fails `npm test` if you do. The compact 28px tier (`size="sm"`) is only for labelled actions inside list rows (apps, settings) and icon-only row actions. Floating action pills use the standard height. The test carries the allowlist.
