import { cn } from "@/lib/utils"

/**
 * Full-bleed rule — a horizontal hairline that escapes the frame and runs the
 * entire viewport width, crossing the rails. Every band boundary on the page
 * uses one of these; the intersections are what make the lattice read as a
 * drafting sheet instead of a bordered box.
 * Needs `overflow-x: clip` on an ancestor (set on body) — never `hidden`,
 * which would create a scroll container and kill position:sticky.
 */
export function Rule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        // z-10: band rules must paint above opaque cell backgrounds that sit
        // flush against the band top, or cells swallow the 1px line
        "pointer-events-none absolute top-0 left-1/2 z-10 h-px w-screen -translate-x-1/2 bg-border/60",
        className
      )}
    />
  )
}

/**
 * Corner tick — a small "+" where a section divider meets the rails.
 * Reserved for section boundaries (major intersections), not every band rule.
 */
export function Tick({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        // z-30: drafting marks sit above everything, including breakout bands
        "pointer-events-none absolute z-30 hidden size-[9px] sm:block",
        className
      )}
    >
      <span className="absolute top-1/2 left-0 h-px w-full bg-foreground/25" />
      <span className="absolute top-0 left-1/2 h-full w-px bg-foreground/25" />
    </span>
  )
}

/**
 * Page frame — the "rails": a bounded sheet whose vertical hairlines run the
 * full height of the page. Two solid inner rails bound the content; a dashed
 * outer pair 24px out forms the drafting-margin gutter. Horizontal rules
 * (Rule) cross the whole viewport, so the rails sit on a real lattice.
 * The frame is a finite object: it opens with a rule + ticks and closes with
 * one — the footer lives outside it.
 */
export function PageFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[1200px]", className)}>
      {/* Inner rails — solid. z-10: opaque cells flush against the frame
          edge must never swallow the rail line (paint order). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden border-border/60 border-l sm:block"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden border-border/60 border-r sm:block"
      />
      {/* Outer rails — dashed, the drafting-margin gutter */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-6 z-10 hidden border-border/40 border-l border-dashed min-[1300px]:block"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -right-6 z-10 hidden border-border/40 border-r border-dashed min-[1300px]:block"
      />
      {/* Frame opening */}
      <Rule />
      <Tick className="-top-[4.5px] -left-[4.5px]" />
      <Tick className="-top-[4.5px] -right-[4.5px]" />
      {children}
      {/* Frame closing — rails terminate here; the footer breathes outside */}
      <Rule className="top-auto bottom-0" />
      <Tick className="-bottom-[4.5px] -left-[4.5px]" />
      <Tick className="-right-[4.5px] -bottom-[4.5px]" />
    </div>
  )
}

/**
 * Section — a major chapter of the frame: full-bleed top rule + corner ticks.
 * The optional mono caption sits on the line (used by subpages).
 */
export function Section({
  id,
  caption,
  children,
  className,
}: {
  id?: string
  caption?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("relative", className)}>
      <Rule />
      <Tick className="-top-[4.5px] -left-[4.5px]" />
      <Tick className="-top-[4.5px] -right-[4.5px]" />
      {caption && (
        <span className="label-mono absolute top-0 left-5 z-10 -translate-y-1/2 bg-background px-2 text-muted-foreground sm:left-9">
          {caption}
        </span>
      )}
      {children}
    </section>
  )
}

/**
 * Gutter hatch — diagonal engineering hatch activating the frame's margins
 * beside a band. Two zones:
 *  - "gutter": the 24px drafting margin between inner and outer rails
 *  - "outer":  the outermost flank, from the dashed rail to the viewport
 *    edge, capped top/bottom by the band's full-bleed rules
 * Reserve for bands carrying a major artifact; never inside the lattice,
 * never on adjacent bands.
 */
export function GutterHatch({
  area = "gutter",
  className,
}: {
  area?: "gutter" | "outer"
  className?: string
}) {
  if (area === "outer") {
    // Fixed 5rem flanks at the viewport edges — sized to sit flush against
    // a breakout band spanning calc(100vw - 10rem)
    return (
      <>
        <span
          aria-hidden
          className={cn(
            "pattern-hatch pointer-events-none absolute inset-y-0 left-[calc(50%-50vw)] hidden w-20 opacity-60 min-[1400px]:block",
            className
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pattern-hatch pointer-events-none absolute inset-y-0 right-[calc(50%-50vw)] hidden w-20 opacity-60 min-[1400px]:block",
            className
          )}
        />
      </>
    )
  }
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pattern-hatch pointer-events-none absolute inset-y-0 -left-6 hidden w-6 opacity-60 min-[1300px]:block",
          className
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pattern-hatch pointer-events-none absolute inset-y-0 -right-6 hidden w-6 opacity-60 min-[1300px]:block",
          className
        )}
      />
    </>
  )
}

/**
 * Band — one full-width row of the frame. Bands stack inside a Section;
 * each draws its own full-bleed top rule (skip on the first, the Section
 * already drew it). Subdivide a band with grid + `gap-px bg-border/60`
 * lattice cells or `divide-x` — the internal lines span only this band.
 */
export function Band({
  children,
  className,
  rule = false,
  id,
}: {
  children: React.ReactNode
  className?: string
  /** draw a full-bleed hairline at the band's top edge */
  rule?: boolean
  id?: string
}) {
  return (
    <div id={id} className={cn("relative", className)}>
      {rule && <Rule />}
      {children}
    </div>
  )
}
