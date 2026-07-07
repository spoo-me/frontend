import { cn } from "@/lib/utils"

/**
 * Status tint map (DIRECTION §3): dot + text in a soft tint, same hue both
 * themes — only the alpha math differs. Never solid fills.
 */
const TONES = {
  emerald:
    "bg-live/10 text-live dark:bg-live/15 [--dot:var(--live)]",
  neutral:
    "bg-muted text-muted-foreground [--dot:currentColor]",
  amber:
    "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 [--dot:currentColor]",
  red: "bg-destructive/10 text-destructive dark:bg-destructive/15 [--dot:currentColor]",
  blue: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400 [--dot:currentColor]",
} as const

type Tone = keyof typeof TONES

const LINK_STATUS: Record<string, { tone: Tone; label: string }> = {
  ACTIVE: { tone: "emerald", label: "Active" },
  INACTIVE: { tone: "neutral", label: "Inactive" },
  EXPIRED: { tone: "amber", label: "Expired" },
  BLOCKED: { tone: "red", label: "Blocked" },
}

const DOMAIN_STATUS: Record<string, { tone: Tone; label: string }> = {
  PENDING: { tone: "neutral", label: "Pending" },
  VERIFYING: { tone: "blue", label: "Verifying" },
  ACTIVE: { tone: "emerald", label: "Active" },
  SUSPENDED: { tone: "amber", label: "Suspended" },
  REVOKED: { tone: "red", label: "Revoked" },
}

export function StatusPill({
  status,
  kind = "link",
  className,
}: {
  status: string | null | undefined
  kind?: "link" | "domain"
  className?: string
}) {
  const map = kind === "domain" ? DOMAIN_STATUS : LINK_STATUS
  const s = map[status ?? ""] ?? { tone: "neutral" as Tone, label: status ?? "–" }
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-medium",
        TONES[s.tone],
        className,
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-[color:var(--dot)] opacity-80"
      />
      {s.label}
    </span>
  )
}
