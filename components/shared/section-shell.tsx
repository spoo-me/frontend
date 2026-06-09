import { cn } from "@/lib/utils"

/**
 * Page frame — the "rails": a bounded container whose vertical hairlines run
 * the full height of the page, giving every section a shared structure.
 * Sections divide it with horizontal rules (see Section below).
 */
export function PageFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-border/60 relative mx-auto w-full max-w-[1200px] overflow-hidden sm:border-x",
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Corner tick — a small "+" where a section divider meets the rails.
 */
function Tick({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-10 hidden size-[9px] sm:block",
        className,
      )}
    >
      <span className="bg-foreground/25 absolute top-1/2 left-0 h-px w-full" />
      <span className="bg-foreground/25 absolute left-1/2 top-0 h-full w-px" />
    </span>
  )
}

/**
 * Section — a frame-aware section: top hairline divider, a mono caption
 * sitting on the line, and corner ticks at the rail intersections.
 * Replaces the per-section floating eyebrows.
 */
export function Section({
  id,
  caption,
  num,
  children,
  className,
}: {
  id?: string
  caption?: string
  /** chapter number rendered as a bracketed mono prefix: [01] */
  num?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("border-border/60 relative border-t", className)}>
      <Tick className="-top-[4.5px] -left-[4.5px]" />
      <Tick className="-top-[4.5px] -right-[4.5px]" />
      {caption && (
        <span className="label-mono text-muted-foreground bg-background absolute top-0 left-5 -translate-y-1/2 px-2 sm:left-9">
          {num && (
            <span className="text-muted-foreground/50">
              [<span className="text-muted-foreground/80">{num}</span>]{" "}
            </span>
          )}
          {caption}
        </span>
      )}
      {children}
    </section>
  )
}
