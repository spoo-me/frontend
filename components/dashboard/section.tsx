import { cn } from "@/lib/utils"

/**
 * Section grammar (DIRECTION §4): icon + label-mono title left, quiet action
 * right — everywhere, no exceptions. Cards are for actions; prose headings sit
 * directly on the canvas (ref 12).
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
    <div className={cn("flex h-9 items-center justify-between", className)}>
      <span className="flex min-w-0 items-center gap-2">
        {lead ??
          (Icon && (
            <Icon
              className="text-muted-foreground/70 size-3.5 shrink-0"
              strokeWidth={1.75}
            />
          ))}
        <span className="label-mono text-muted-foreground truncate">{title}</span>
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
        "border-border/60 bg-card overflow-hidden rounded-xl border",
        className,
      )}
    >
      {children}
    </div>
  )
}
