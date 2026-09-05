"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Check, LoaderCircle, Minus } from "lucide-react"

import {
  createCheckout,
  getPlans,
  SpooApiError,
  type Cadence,
  type FeatureName,
  type LimitName,
} from "@/lib/api"
import {
  trackPlanCtaClicked,
  trackPricingViewed,
  trackUpgradeStarted,
} from "@/lib/analytics"
import {
  COMPARISON_FEATURES,
  COMPARISON_LIMITS,
  FEATURE_COPY,
  LIMIT_COPY,
  formatLimit,
} from "@/lib/entitlements/copy"
import { isFeatureName, isLimitName } from "@/lib/entitlements/keys"
import { safeReturnPath, stashVersion } from "@/lib/entitlements/return-flow"
import { formatDate } from "@/lib/format"
import { useEntitlements } from "@/hooks/use-entitlements"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/dashboard/section"
import { Segmented } from "@/components/dashboard/segmented"
import { ProMark } from "@/components/plan/pro-mark"
import { PortalButton } from "@/components/plan/plan-banner"

/**
 * The upgrade page: the plan comparison from GET /api/v1/plans (the same
 * table the backend enforces), the founding discount when the window is
 * open, a monthly or year toggle, and one checkout button that asks the
 * server for a checkout link and follows it.
 */
export default function UpgradePage() {
  const params = useSearchParams()
  const from = params.get("from")
  const returnTo = safeReturnPath(params.get("return"))
  const { entitlements, settled } = useEntitlements()
  // Dark catalog entries come back hidden; the table never sells those. With
  // no answer at all (query failed) every comparison row is shown.
  const features = entitlements?.features
  const featureRows = features
    ? COMPARISON_FEATURES.filter((k) => {
        const state = features[k]
        return state === "enabled" || state === "locked"
      })
    : COMPARISON_FEATURES
  const rowsLoading = !features && !settled
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

  const fromCopy =
    isFeatureName(from) && featureRows.includes(from)
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
    <div className="mx-auto w-full max-w-4xl pb-8">
      <span className="label-mono text-muted-foreground/60">Plan</span>
      <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
        {fromCopy ? fromCopy.heading : "Upgrade to Pro"}
      </h1>
      <p className="mt-1 max-w-xl text-muted-foreground text-sm">
        {fromCopy
          ? fromCopy.blurb
          : "Brand control for people who publish links to their own product: your domain, your preview card, your routing rules, kept forever."}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel className="order-2 overflow-hidden lg:order-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/60 border-b text-left">
                <th className="px-4 py-3 font-normal text-muted-foreground text-xs">
                  What you get
                </th>
                <th className="w-16 px-2 py-3 text-center font-mono text-[11px] text-muted-foreground uppercase tracking-[0.12em] sm:w-24 sm:px-4">
                  Free
                </th>
                <th className="w-16 px-2 py-3 text-center sm:w-24 sm:px-4">
                  <ProMark size="md" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rowsLoading
                ? COMPARISON_FEATURES.map((key) => (
                    <PlaceholderRow key={key} feature={key} />
                  ))
                : featureRows.map((key) => (
                    <FeatureRow key={key} feature={key} plans={data?.plans} />
                  ))}
              {COMPARISON_LIMITS.map((key) => (
                <LimitRow key={key} limit={key} plans={data?.plans} />
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel className="order-1 h-fit p-5 lg:sticky lg:top-6 lg:order-2">
          {isPro ? (
            <div className="space-y-4">
              <p className="text-sm">
                You are on Pro
                {entitlements?.plan.founding ? ", as a founding member." : "."}
              </p>
              <PortalButton>Manage billing</PortalButton>
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

              <div className="mt-5 flex min-h-[64px] items-end gap-2">
                {shown ? (
                  <>
                    {foundingOpen && list && (
                      <span className="font-mono text-muted-foreground text-sm tabular-nums line-through">
                        ${list.amount}
                      </span>
                    )}
                    <span className="font-semibold text-3xl text-foreground tabular-nums tracking-tight">
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

              <p className="mt-2 min-h-[32px] text-muted-foreground text-xs leading-relaxed">
                {cadence === "monthly"
                  ? "Renews monthly. Cancel any time from the billing portal."
                  : "Paid once for twelve months. It does not renew on its own; you get a reminder before it ends."}
              </p>

              {foundingOpen && founding && foundingUntil && (
                <div className="mt-4 rounded-lg border border-border/60 bg-background px-3 py-2.5">
                  <span className="label-mono text-muted-foreground/70">
                    Founding cohort
                  </span>
                  <p className="mt-1 text-foreground text-xs leading-relaxed">
                    This price stays yours while you stay subscribed.{" "}
                    <span className="font-mono tabular-nums">
                      {founding.seats_left} of {founding.seats_total}
                    </span>{" "}
                    seats left, until {formatDate(foundingUntil)}.
                  </p>
                </div>
              )}

              <Button
                className="mt-5 w-full"
                disabled={busy || !shown}
                onClick={checkout}
              >
                {busy && <LoaderCircle className="size-3.5 animate-spin" />}
                Continue to payment
              </Button>
              {error && (
                <p className="mt-2 text-destructive text-xs">{error}</p>
              )}
              <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground/60">
                14-day refund on both. Prices in USD; local methods at checkout.
              </p>
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}

type PlanList = NonNullable<Awaited<ReturnType<typeof getPlans>>["plans"]>

function FeatureRow({
  feature,
  plans,
}: {
  feature: FeatureName
  plans: PlanList | undefined
}) {
  const copy = FEATURE_COPY[feature]
  const has = (name: "free" | "pro") =>
    plans?.find((p) => p.name === name)?.features[feature] ?? false
  return (
    <tr>
      <td className="px-4 py-3">
        <span className="block text-foreground text-sm">{copy.title}</span>
        <span className="block text-muted-foreground text-xs">
          {copy.blurb}
        </span>
      </td>
      <Cell on={has("free")} />
      <Cell on={has("pro")} />
    </tr>
  )
}

/** The real copy drawn as a skeleton, so each row wraps to the height it will have once loaded. */
function PlaceholderRow({ feature }: { feature: FeatureName }) {
  const copy = FEATURE_COPY[feature]
  return (
    <tr aria-hidden>
      <td className="px-4 py-3">
        <span className="block w-fit animate-pulse select-none rounded bg-primary/10 text-sm text-transparent">
          {copy.title}
        </span>
        <span className="block w-fit animate-pulse select-none rounded bg-primary/10 text-transparent text-xs">
          {copy.blurb}
        </span>
      </td>
      <td />
      <td />
    </tr>
  )
}

function LimitRow({
  limit,
  plans,
}: {
  limit: LimitName
  plans: PlanList | undefined
}) {
  const copy = LIMIT_COPY[limit]
  const value = (name: "free" | "pro") =>
    plans?.find((p) => p.name === name)?.limits[limit]
  return (
    <tr>
      <td className="px-4 py-3 text-foreground text-sm">{copy.label}</td>
      {(["free", "pro"] as const).map((name) => {
        const v = value(name)
        return (
          <td
            key={name}
            className="px-2 py-3 text-center font-mono text-[12px] text-foreground tabular-nums sm:px-4"
          >
            {v === undefined ? "" : formatLimit(limit, v)}
          </td>
        )
      })}
    </tr>
  )
}

function Cell({ on }: { on: boolean }) {
  return (
    <td className="px-2 py-3 text-center sm:px-4">
      {on ? (
        <Check className="mx-auto size-4 text-foreground" strokeWidth={2} />
      ) : (
        <Minus
          className="mx-auto size-4 text-muted-foreground/40"
          strokeWidth={2}
        />
      )}
    </td>
  )
}
