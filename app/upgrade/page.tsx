"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"

import { createCheckout, getPlans, SpooApiError, type Cadence } from "@/lib/api"
import {
  trackPlanCtaClicked,
  trackPricingViewed,
  trackUpgradeStarted,
} from "@/lib/analytics"
import {
  COMPARISON_LIMITS,
  FEATURE_COPY,
  LIMIT_COPY,
} from "@/lib/entitlements/copy"
import { isFeatureName, isLimitName } from "@/lib/entitlements/keys"
import { safeReturnPath, stashVersion } from "@/lib/entitlements/return-flow"
import { useEntitlements } from "@/hooks/use-entitlements"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { PlanTable } from "@/components/plan/plan-table"
import { PortalButton } from "@/components/plan/plan-banner"

/**
 * The upgrade page: the same plan table as /pricing, fed by GET
 * /api/v1/plans (the table the backend enforces), with the account's own
 * state in the headers and one checkout button that asks the server for a
 * checkout link and follows it.
 */
export default function UpgradePage() {
  const params = useSearchParams()
  const from = params.get("from")
  const returnTo = safeReturnPath(params.get("return"))
  const { entitlements } = useEntitlements()
  const { user } = useAuth()
  const plans = useQuery({ queryKey: ["plans"], queryFn: getPlans })
  const [cadence, setCadence] = React.useState<Cadence>("monthly")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    trackPricingViewed("upgrade")
  }, [])

  // In grace the account is still Pro, and this page is where it renews.
  const isPro =
    entitlements?.plan.name === "pro" && entitlements.plan.status !== "grace"
  const isFree = entitlements?.plan.name === "free"

  async function checkout() {
    if (busy) return
    setBusy(true)
    setError(null)
    trackPlanCtaClicked("pro", cadence)
    try {
      stashVersion(entitlements?.version)
      const { url } = await createCheckout({
        cadence,
        ...(from ? { from } : {}),
        return: returnTo,
      })
      trackUpgradeStarted(cadence, from ?? undefined)
      window.location.assign(url)
    } catch (err) {
      setError(
        err instanceof SpooApiError
          ? err.message
          : "Couldn't start the checkout. Try again in a moment."
      )
      setBusy(false)
    }
  }

  const fromCopy = isFeatureName(from)
    ? {
        heading: `${FEATURE_COPY[from].title} is part of Pro`,
        blurb: FEATURE_COPY[from].blurb,
      }
    : isLimitName(from) && COMPARISON_LIMITS.includes(from)
      ? {
          heading: "Room for more on Pro",
          blurb: `Pro raises the ${LIMIT_COPY[from].label.toLowerCase()} limit.`,
        }
      : null

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <PlanTable
        title={
          <>
            <span className="label-mono text-muted-foreground/60">Plan</span>
            <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
              {fromCopy ? fromCopy.heading : "Upgrade to Pro"}
            </h1>
          </>
        }
        subtitle={
          fromCopy
            ? fromCopy.blurb
            : "Brand control for people who publish links to their own product: your domain, your preview card, your routing rules, kept forever."
        }
        plans={plans.data}
        loading={plans.isPending}
        cadence={cadence}
        onCadence={setCadence}
        waitlistEmail={user?.email ?? ""}
        freeAction={
          isFree ? (
            <YourPlan />
          ) : (
            <span className="flex h-9 items-center font-mono text-[11px] text-muted-foreground/60">
              Included with every account
            </span>
          )
        }
        proAction={
          isPro ? (
            <div className="space-y-2">
              <PortalButton>Manage billing</PortalButton>
              <p className="font-mono text-[11px] text-muted-foreground">
                Your plan
                {entitlements?.plan.founding ? ", founding member" : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                className="w-full"
                disabled={busy || !plans.data?.prices[cadence]}
                onClick={checkout}
              >
                {busy && <LoaderCircle className="size-3.5 animate-spin" />}
                Continue to payment
              </Button>
              {error && <p className="text-destructive text-xs">{error}</p>}
            </div>
          )
        }
      />
      <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground/60">
        14-day refund on monthly and one year. Prices in USD; local methods at
        checkout.
      </p>
    </div>
  )
}

function YourPlan() {
  return (
    <span className="flex h-9 items-center font-mono text-[11px] text-muted-foreground">
      Your plan
    </span>
  )
}
