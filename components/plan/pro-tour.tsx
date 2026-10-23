"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"

import {
  completeProOnboarding,
  SpooApiError,
  type FeatureName,
} from "@/lib/api"
import {
  onLinkComposerOpen,
  openLinkComposer,
} from "@/components/dashboard/links/composer"
import { trackProOnboarding } from "@/lib/analytics"
import { FEATURE_COPY } from "@/lib/entitlements/copy"
import { isFeatureName } from "@/lib/entitlements/keys"
import { cn } from "@/lib/utils"
import { useEntitlements } from "@/hooks/use-entitlements"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProMark } from "./pro-mark"

/**
 * The Pro tour: shown once, the first time the plan is active and the
 * account has not seen it, in the same one-step-at-a-time shape as the
 * initial onboarding. One step per unlocked group, each with a try-it link
 * into the real control. There is no trial; "try it" means guided steps.
 */
type Step = {
  group: FeatureCopyGroup
  title: string
  body: string
  tryHref: string
  tryLabel: string
  tryTab?: "metadata" | "targeting"
}

type FeatureCopyGroup = (typeof FEATURE_COPY)[FeatureName]["group"]

const STEPS: Step[] = [
  {
    group: "domain",
    title: "Your own domain",
    body: "Short links on a domain you own. Add it, publish one DNS record, and every new link can live there.",
    tryHref: "/dashboard/domains",
    tryLabel: "Add a domain",
  },
  {
    group: "preview",
    title: "Your preview card",
    body: "Set the title, description and image people see when a link is shared, per link.",
    tryHref: "/dashboard/links",
    tryLabel: "Compose with a card",
    tryTab: "metadata",
  },
  {
    group: "qr",
    title: "Branded QR codes",
    body: "Your logo in the middle of every QR code you download.",
    tryHref: "/dashboard/links",
    tryLabel: "Open a link",
  },
  {
    group: "routing",
    title: "Routing rules",
    body: "Send countries to different destinations, split visitors across variants, schedule a launch, and choose where an ended link sends people.",
    tryHref: "/dashboard/links",
    tryLabel: "Compose with rules",
    tryTab: "targeting",
  },
  {
    group: "analytics",
    title: "Deeper analytics",
    body: "Two years of history instead of ninety days, hour and weekday views, and every click recorded when a link goes viral.",
    tryHref: "/dashboard/analytics",
    tryLabel: "Open analytics",
  },
]

export function ProTour() {
  const { entitlements } = useEntitlements()
  const { user, setUser } = useAuth()
  const [dismissed, setDismissed] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  // A draft restored after checkout reopens the composer; the tour waits
  // its turn rather than dismissing it by taking focus.
  const [composerOpen, setComposerOpen] = React.useState(false)
  React.useEffect(() => onLinkComposerOpen(setComposerOpen), [])
  const plan = entitlements?.plan
  const unlocked = React.useMemo(() => {
    const groups = new Set<FeatureCopyGroup>()
    for (const [key, state] of Object.entries(entitlements?.features ?? {})) {
      if (state === "enabled" && isFeatureName(key))
        groups.add(FEATURE_COPY[key].group)
    }
    return STEPS.filter((s) => groups.has(s.group))
  }, [entitlements?.features])

  const show =
    !dismissed &&
    !composerOpen &&
    plan?.name === "pro" &&
    plan.status === "active" &&
    user?.pro_onboarded_at === null &&
    unlocked.length > 0

  React.useEffect(() => {
    if (show) trackProOnboarding("started")
  }, [show])

  async function finish(reason: "completed" | "dismissed") {
    setDismissed(true)
    trackProOnboarding(reason)
    try {
      await completeProOnboarding()
      if (user) setUser({ ...user, pro_onboarded_at: new Date().toISOString() })
    } catch (err) {
      // 403: the plan lapsed under the open tour; nothing to save.
      if (err instanceof SpooApiError && err.status === 403) return
      toast.error(
        err instanceof SpooApiError
          ? err.message
          : "Couldn't save that the tour was seen."
      )
    }
  }

  if (!show) return null
  const step = unlocked[Math.min(index, unlocked.length - 1)]
  const last = index >= unlocked.length - 1
  return (
    <Dialog open onOpenChange={(open) => !open && void finish("dismissed")}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="flex items-center gap-2">
            <ProMark />
            <span className="label-mono text-muted-foreground/60">
              {index + 1} of {unlocked.length}
            </span>
          </span>
          <DialogTitle className="mt-2">{step.title}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {step.body}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1 pt-1">
          {unlocked.map((s, i) => (
            <span
              key={s.group}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-200",
                i <= index ? "bg-foreground" : "bg-border"
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={() => void finish("dismissed")}>
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link
                href={step.tryHref}
                onClick={() => {
                  void finish("completed")
                  if (step.tryTab) openLinkComposer({ tab: step.tryTab })
                }}
              >
                {step.tryLabel}
              </Link>
            </Button>
            <Button
              onClick={() =>
                last ? void finish("completed") : setIndex((i) => i + 1)
              }
            >
              {last ? "Done" : "Next"}
              {!last && <ArrowRight className="size-3.5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
