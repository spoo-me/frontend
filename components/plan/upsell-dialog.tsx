"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"

import {
  createCheckout,
  getPlans,
  SpooApiError,
  type Cadence,
  type FeatureName,
  type LimitName,
} from "@/lib/api"
import {
  trackLockedFeatureUpgradeClicked,
  trackLockedFeatureViewed,
} from "@/lib/analytics"
import { FEATURE_COPY, LIMIT_COPY, formatLimit } from "@/lib/entitlements/copy"
import { clearDraft } from "@/lib/entitlements/draft-stash"
import { stashVersion } from "@/lib/entitlements/return-flow"
import { formatDate } from "@/lib/format"
import { useEntitlements, useLimit } from "@/hooks/use-entitlements"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Segmented } from "@/components/dashboard/segmented"
import { ProMark } from "./pro-mark"

/**
 * The one upsell. Every gate opens it: a submit that uses features the plan
 * lacks, an add button at its limit, an analytics range past the window. It
 * names what triggered it, prices Pro the way /upgrade does, and starts
 * checkout with the user's place remembered. At a limit no plan raises, it
 * says so and sells nothing.
 */
export type UpsellTrigger =
  | { kind: "features"; features: FeatureName[] }
  | { kind: "limit"; limit: LimitName }

const VIEWED_KEY = "spoo:locked-viewed"

function markViewed(key: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(VIEWED_KEY)
    const seen: string[] = raw ? (JSON.parse(raw) as string[]) : []
    if (seen.includes(key)) return false
    window.sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...seen, key]))
    return true
  } catch {
    return true
  }
}

const article = (noun: string) => (/^[aeiou]/.test(noun) ? "an" : "a")

export function UpsellDialog({
  trigger,
  open,
  onOpenChange,
  onBeforeCheckout,
}: {
  trigger: UpsellTrigger
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs before leaving for payment; forms stash their draft here. */
  onBeforeCheckout?: () => void
}) {
  const pathname = usePathname()
  const { entitlements } = useEntitlements()
  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
    enabled: open,
  })
  const [cadence, setCadence] = React.useState<Cadence>("monthly")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const keys = trigger.kind === "features" ? trigger.features : [trigger.limit]
  const from = keys[0]
  React.useEffect(() => {
    if (!open) return
    for (const key of keys) if (markViewed(key)) trackLockedFeatureViewed(key)
    // Keyed on the joined list so a changed set fires for its new members.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, keys.join(",")])

  const limit = trigger.kind === "limit" ? trigger.limit : null
  const view = useLimit(limit ?? "custom_domains_max")
  const proPlan = plans.data?.plans.find((p) => p.name === "pro")
  const proMax = limit ? proPlan?.limits[limit] : undefined
  // No plan raises this limit: on Pro already, or Pro's own cap is no higher.
  const atMaximum =
    limit !== null &&
    (entitlements?.plan.name === "pro" ||
      (proMax !== undefined && proMax !== -1 && proMax <= view.max))

  const data = plans.data
  const founding = data?.founding
  const foundingUntil = founding?.until ?? null
  const foundingOpen =
    founding != null &&
    foundingUntil !== null &&
    (founding.seats_left ?? 0) > 0 &&
    new Date(foundingUntil).getTime() > Date.now()
  const list = data?.prices[cadence]
  const shown = foundingOpen ? founding[cadence] : list
  const perMonth =
    shown && (cadence === "year" ? Math.round(shown.amount / 12) : shown.amount)

  async function checkout() {
    if (busy || !from) return
    setBusy(true)
    setError(null)
    trackLockedFeatureUpgradeClicked(from)
    try {
      onBeforeCheckout?.()
      stashVersion(entitlements?.version)
      const { url } = await createCheckout({
        cadence,
        from,
        return: `${pathname}${window.location.search}`,
      })
      window.location.assign(url)
    } catch (err) {
      clearDraft()
      setError(
        err instanceof SpooApiError
          ? err.message
          : "Couldn't start the checkout. Try again in a moment."
      )
      setBusy(false)
    }
  }

  let title: string
  let body: React.ReactNode
  if (trigger.kind === "features") {
    const [first] = trigger.features
    if (trigger.features.length === 1 && first) {
      title = `${FEATURE_COPY[first].title} is part of Pro`
      body = FEATURE_COPY[first].blurb
    } else {
      title = "These need Pro"
      body = (
        <span className="block font-mono text-xs leading-relaxed">
          {trigger.features.map((f) => FEATURE_COPY[f].title).join(", ")}
        </span>
      )
    }
  } else {
    const copy = LIMIT_COPY[trigger.limit]
    const isWindow = trigger.limit === "analytics_window_days"
    if (atMaximum) {
      title = isWindow
        ? "Older clicks are outside the plan window"
        : `${copy.label} are at the plan maximum`
      body = isWindow
        ? `The plan keeps ${formatLimit(trigger.limit, view.max)} of clicks, its maximum.`
        : `Remove ${article(copy.noun)} ${copy.noun} to add another.`
    } else {
      title = isWindow
        ? "Older clicks are part of Pro"
        : `Room for more ${copy.label.toLowerCase()} on Pro`
      body =
        proMax === undefined
          ? ""
          : isWindow
            ? `Pro keeps ${formatLimit(trigger.limit, proMax)} of clicks.`
            : `Pro raises the limit to ${formatLimit(trigger.limit, proMax)}.`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <ProMark size="md" className="w-fit" />
          <DialogTitle className="mt-2">{title}</DialogTitle>
          <DialogDescription className="min-h-5 leading-relaxed">
            {body}
          </DialogDescription>
        </DialogHeader>

        {atMaximum ? (
          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <Segmented
              value={cadence}
              onChange={setCadence}
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "year", label: "One year" },
              ]}
            />

            <div className="flex min-h-[44px] items-end gap-2">
              {shown ? (
                <>
                  {foundingOpen && list && (
                    <span className="font-mono text-muted-foreground text-sm tabular-nums line-through">
                      ${list.amount}
                    </span>
                  )}
                  <span className="font-semibold text-2xl text-foreground tabular-nums tracking-tight">
                    ${shown.amount}
                  </span>
                  <span className="pb-1 font-mono text-[11px] text-muted-foreground">
                    {cadence === "monthly"
                      ? "/ month"
                      : `one time, about $${perMonth} / month`}
                  </span>
                </>
              ) : (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {plans.isPending ? "loading" : "Prices unavailable"}
                </span>
              )}
            </div>

            <p className="min-h-8 text-muted-foreground text-xs leading-relaxed">
              {foundingOpen && founding && foundingUntil ? (
                <>
                  Founding price, yours while you stay subscribed.{" "}
                  <span className="font-mono tabular-nums">
                    {founding.seats_left} of {founding.seats_total}
                  </span>{" "}
                  seats left, until {formatDate(foundingUntil)}.
                </>
              ) : cadence === "monthly" ? (
                "Renews monthly. Cancel any time from the billing portal."
              ) : (
                "Paid once for twelve months. It does not renew on its own."
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Not now
              </Button>
              <Button disabled={busy || !shown} onClick={checkout}>
                {busy && <LoaderCircle className="size-3.5 animate-spin" />}
                Continue to payment
              </Button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
