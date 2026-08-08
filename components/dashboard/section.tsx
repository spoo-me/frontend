import { cn } from "@/lib/utils"

/**
 * Section grammar: icon + label-mono title left, quiet action right —
 * everywhere, no exceptions. Cards are for actions; prose headings sit
 * directly on the canvas.
 */
export function SectionHeader({
  icon: Icon,
  title,
  badge,
  action,
  lead,
  className,
}: {
  icon?: React.ElementType
  title: string
  /** Quiet annotation after the title (e.g. a widget's scope chip). */
  badge?: React.ReactNode
  action?: React.ReactNode
  /** Replaces the icon slot (e.g. a drag grip that swaps in on hover). */
  lead?: React.ReactNode
  className?: string
}) {
  return (
    // The data attributes are the measuring points for HeaderControls'
    // fold-when-tight mechanic (analytics/metric-control.tsx).
    <div
      data-section-header
      className={cn("flex h-9 items-center justify-between", className)}
    >
      <span className="flex min-w-0 items-center gap-2">
        {lead ??
          (Icon && (
            <Icon
              className="size-3.5 shrink-0 text-muted-foreground/70"
              strokeWidth={1.75}
            />
          ))}
        <span
          data-section-title
          className="label-mono truncate text-muted-foreground"
        >
          {title}
        </span>
        {badge}
      </span>
      {action}
    </div>
  )
}

/** Bordered content card (component-tier hairline, card surface). */
export function Panel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card",
        className
      )}
    >
      {children}
    </div>
  )
}
