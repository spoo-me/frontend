import { cn } from "@/lib/utils"

/**
 * Section grammar (DIRECTION §4): icon + label-mono title left, quiet action
 * right — everywhere, no exceptions. Cards are for actions; prose headings sit
 * directly on the canvas (ref 12).
 */
export function SectionHeader({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon?: React.ElementType
  title: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex h-9 items-center justify-between", className)}>
      <span className="flex items-center gap-2">
        {Icon && (
          <Icon className="text-muted-foreground/70 size-3.5" strokeWidth={1.75} />
        )}
        <span className="label-mono text-muted-foreground">{title}</span>
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
