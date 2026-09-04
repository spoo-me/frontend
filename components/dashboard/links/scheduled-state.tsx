import { cn } from "@/lib/utils"

/**
 * A scheduled link's state, as quiet mono text in the viewer's timezone:
 * "live Sep 10, 18:00". It stands where the status pill would, so nothing
 * shifts when the link flips to ACTIVE at the start instant.
 */

export function formatGoLive(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function ScheduledState({
  startsAt,
  className,
}: {
  startsAt: number
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center font-mono text-muted-foreground text-xs tabular-nums",
        className
      )}
    >
      live {formatGoLive(startsAt)}
    </span>
  )
}
