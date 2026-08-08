"use client"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Status tint map: dot + text in a soft tint, same hue both
 * themes — only the alpha math differs. Never solid fills.
 */
const TONES = {
  emerald: "bg-live/10 text-live dark:bg-live/15 [--dot:var(--live)]",
  neutral: "bg-muted text-muted-foreground [--dot:currentColor]",
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

const WEBHOOK_STATUS: Record<string, { tone: Tone; label: string }> = {
  active: { tone: "emerald", label: "Active" },
  paused: { tone: "neutral", label: "Paused" },
  disabled: { tone: "red", label: "Disabled" },
}

/** What a status MEANS for serving behavior — the pill's tooltip copy. */
const DOMAIN_MEANING: Record<string, string> = {
  PENDING: "Registered; DNS records not added yet.",
  VERIFYING: "Checking your DNS records and issuing TLS.",
  ACTIVE: "Serving links over HTTPS.",
  SUSPENDED: "Temporarily not serving; links and stats are kept.",
  REVOKED: "Permanently stopped; can only be re-registered from scratch.",
}

const WEBHOOK_MEANING: Record<string, string> = {
  active: "Delivering events.",
  paused: "Paused by you; events are skipped, not queued.",
  disabled: "Stopped by the system after failures; resume to re-enable.",
}

export function statusMeaning(
  status: string | null | undefined,
  kind: "link" | "domain" | "webhook"
): string | undefined {
  if (kind === "domain") return DOMAIN_MEANING[status ?? ""]
  if (kind === "webhook") return WEBHOOK_MEANING[status ?? ""]
  return undefined
}

export function StatusPill({
  status,
  kind = "link",
  explain,
  className,
}: {
  status: string | null | undefined
  kind?: "link" | "domain" | "webhook"
  /** Hover the pill for what the status means (domain/webhook pills). */
  explain?: boolean
  className?: string
}) {
  const map =
    kind === "domain"
      ? DOMAIN_STATUS
      : kind === "webhook"
        ? WEBHOOK_STATUS
        : LINK_STATUS
  const s = map[status ?? ""] ?? {
    tone: "neutral" as Tone,
    label: status ?? "–",
  }
  const pill = (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2 font-medium text-xs",
        TONES[s.tone],
        className
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-[color:var(--dot)] opacity-80"
      />
      {s.label}
    </span>
  )
  const meaning = explain ? statusMeaning(status, kind) : undefined
  if (!meaning) return pill
  return (
    <Tooltip>
      <TooltipTrigger asChild>{pill}</TooltipTrigger>
      <TooltipContent>{meaning}</TooltipContent>
    </Tooltip>
  )
}
