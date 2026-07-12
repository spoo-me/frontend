import { cn } from "@/lib/utils"

/**
 * The one empty-state grammar for chart bodies: quiet centered text that
 * fills whatever body the caller gives it, so every widget centers the
 * same way. (The countries map keeps its chip-over-basemap variant.)
 */
export function EmptyRange({
  label = "No data in this range",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-24 w-full items-center justify-center text-muted-foreground/70 text-xs",
        className
      )}
    >
      {label}
    </div>
  )
}
