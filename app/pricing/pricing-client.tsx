"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { Check } from "lucide-react"

import { getPlans, type PlansResponse } from "@/lib/api"
import { trackPlanCtaClicked, trackPricingViewed } from "@/lib/analytics"
import { FEATURE_COPY, formatLimit } from "@/lib/entitlements/copy"
import { formatDate } from "@/lib/format"
import {
  buildPlanGroups,
  foundingIsOpen,
  foundingRemaining,
  yearlySavingPercent,
  type PlanCell,
  type PlanGroupName,
} from "@/lib/plan-table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { WaitlistForm } from "@/components/plan/waitlist-form"

/**
 * The public pricing page. The words are the marketing decision and live
 * here; every number (prices, the founding window, the limits) comes from
 * GET /api/v1/plans so the page cannot disagree with what the backend
 * enforces.
 */
type Cadence = "monthly" | "annually"
type Plan = PlansResponse["plans"][number]

function usePlans() {
  return useQuery({ queryKey: ["plans"], queryFn: getPlans })
}

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString("en")} ${n === 1 ? one : many}`

/** A bullet whose number is not in yet: same slot, no text jump later. */
function Pending({ width }: { width: string }) {
  return (
    <span
      className={cn(
        "inline-block h-3.5 animate-pulse rounded bg-primary/10",
        width
      )}
    />
  )
}

function limitLine(
  plan: Plan | undefined,
  key: keyof Plan["limits"],
  phrase: (n: number) => string,
  width = "w-32"
): React.ReactNode {
  const n = plan?.limits[key]
  if (n === undefined) return <Pending width={width} />
  return n === -1 ? "Unlimited" : phrase(n)
}

export function PricingTiers() {
  const plans = usePlans()
  const [cadence, setCadence] = React.useState<Cadence>("annually")
  React.useEffect(() => {
    trackPricingViewed("pricing")
  }, [])
  const apiCadence = cadence === "annually" ? "year" : "monthly"
  // annual = cheaper = digits roll down; monthly = digits roll up
  const dir = cadence === "annually" ? -1 : 1

  const data = plans.data
  const free = data?.plans.find((p) => p.name === "free")
  const pro = data?.plans.find((p) => p.name === "pro")
  const saving = yearlySavingPercent(data?.prices)
  const list = data?.prices[apiCadence]
  const founding = data?.founding ?? null
  const now = Date.now()
  const foundingOpen = foundingIsOpen(founding, now)
  const proAmount = foundingOpen ? founding[apiCadence].amount : list?.amount

  const freeFeatures: React.ReactNode[] = [
    "Unlimited links and clicks",
    limitLine(
      free,
      "analytics_window_days",
      (n) => `${formatLimit("analytics_window_days", n)} of analytics`
    ),
    "API, SDKs and webhooks",
    limitLine(free, "webhook_endpoints_max", (n) =>
      plural(n, "webhook endpoint", "webhook endpoints")
    ),
    limitLine(free, "api_keys_max", (n) => plural(n, "API key", "API keys")),
    "Password, expiry and click limits",
    "QR codes",
  ]
  const proFeatures: React.ReactNode[] = [
    limitLine(
      pro,
      "custom_domains_max",
      (n) => (n === 1 ? "Your own domain" : `Your own domain, up to ${n}`),
      "w-40"
    ),
    "Custom social preview and branded QR codes",
    "Routing rules: geo, A/B, scheduling, expiry fallback",
    "Live click stream, hour and weekday views",
    limitLine(
      pro,
      "analytics_window_days",
      (n) => `${formatLimit("analytics_window_days", n)} of analytics`
    ),
    pro?.limits.webhook_endpoints_max !== undefined &&
    pro.limits.api_rate_multiplier !== undefined ? (
      `${plural(pro.limits.webhook_endpoints_max, "webhook endpoint", "webhook endpoints")} and ${formatLimit("api_rate_multiplier", pro.limits.api_rate_multiplier)} API rate`
    ) : (
      <Pending width="w-48" />
    ),
    limitLine(
      pro,
      "bulk_batch_max",
      (n) => `${n.toLocaleString("en")} links per batch`
    ),
  ]

  return (
    <div>
      {/* Billing toggle: sliding thumb */}
      <div className="flex flex-col items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Billing cadence"
          className="flex items-center rounded-full border border-border/60 bg-muted/30 p-1"
        >
          {(["monthly", "annually"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cadence === c}
              onClick={() => setCadence(c)}
              className={cn(
                "relative rounded-full px-4 py-1.5 font-medium text-sm capitalize transition-colors",
                cadence === c
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cadence === c && (
                <motion.span
                  layoutId="cadence-thumb"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 rounded-full border border-border/60 bg-background shadow-soft dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                />
              )}
              <span className="relative z-10">{c}</span>
            </button>
          ))}
        </div>
        <p className="h-4 font-mono text-[11px] text-muted-foreground">
          {saving !== null ? `save ${saving}% on annual billing` : ""}
        </p>
      </div>

      {/* Tier band: flat columns, the highlighted tier pops out */}
      <div className="mt-10 grid grid-cols-1 rounded-2xl border border-border/60 lg:grid-cols-3 lg:[&>*:not(:first-child)]:border-l lg:[&>*]:border-border/60">
        <Tier
          name="Free"
          tagline="For every link you make and every click on it."
          price={<Price amount={0} note="forever" dir={dir} />}
          cta={
            <Button asChild size="lg" variant="outline" className="h-10 w-full">
              <Link href="/signup">Start free</Link>
            </Button>
          }
          leadIn="Free includes:"
          features={freeFeatures}
        />
        <Tier
          name="Pro"
          highlight
          tagline="Your domain, your preview card, your routing rules."
          price={
            <>
              <Price
                amount={proAmount}
                struck={foundingOpen ? list?.amount : undefined}
                note={cadence === "monthly" ? "/ month" : "/ year"}
                dir={dir}
              />
              {foundingOpen && (
                <div className="mt-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5">
                  <span className="label-mono text-muted-foreground/70">
                    Founding cohort
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground tabular-nums">
                    {foundingRemaining(founding, now)}, until{" "}
                    {formatDate(founding.until)}
                  </p>
                  <p className="mt-1 text-foreground text-xs leading-relaxed">
                    This price stays yours while you stay subscribed.
                  </p>
                </div>
              )}
            </>
          }
          cta={
            <Button asChild size="lg" className="h-10 w-full">
              <Link
                href="/signup?plan=pro"
                onClick={() => trackPlanCtaClicked("pro", apiCadence)}
              >
                Start Pro
              </Link>
            </Button>
          }
          leadIn="Everything in Free, plus:"
          features={proFeatures}
        />
        <Tier
          id="business"
          name="Business"
          tagline="For teams, when it opens."
          price={
            <span className="flex h-10 items-center font-mono text-[11px] text-muted-foreground">
              Coming later
            </span>
          }
          cta={<WaitlistForm buttonClassName="h-10" />}
          leadIn="Will add:"
          features={["Everything in Pro", "Team seats", "Conversion tracking"]}
        />
      </div>
    </div>
  )
}

function Tier({
  id,
  name,
  tagline,
  price,
  cta,
  leadIn,
  features,
  highlight = false,
}: {
  id?: string
  name: string
  tagline: string
  price: React.ReactNode
  cta: React.ReactNode
  leadIn: string
  features: React.ReactNode[]
  highlight?: boolean
}) {
  return (
    <div
      id={id}
      className={cn(
        "relative flex flex-col p-7",
        highlight &&
          "lg:!border-l border-border/80 bg-card lg:-my-5 lg:rounded-2xl lg:border lg:shadow-card dark:lg:shadow-[0_24px_64px_-32px_rgba(0,0,0,0.6)]"
      )}
    >
      {highlight && (
        <span className="absolute -top-2.5 left-7 rounded-full bg-foreground px-2 py-0.5 font-mono font-semibold text-[10px] text-background uppercase tracking-wider lg:top-3.5">
          Most popular
        </span>
      )}
      <h3
        className={cn(
          "font-semibold text-foreground text-lg tracking-tight",
          highlight && "lg:mt-6"
        )}
      >
        {name}
      </h3>
      <p className="mt-1 text-muted-foreground text-sm">{tagline}</p>
      <div className="mt-6">{price}</div>
      <div className="mt-6">{cta}</div>
      <p className="mt-6 font-medium text-foreground/80 text-xs">{leadIn}</p>
      <ul className="mt-3 space-y-2.5">
        {features.map((f, i) => (
          <li
            key={typeof f === "string" ? f : i}
            className="flex items-start gap-2 text-muted-foreground text-sm"
          >
            <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Display price with the digit roll from the original page. */
function Price({
  amount,
  struck,
  note,
  dir,
}: {
  amount: number | undefined
  struck?: number
  note: string
  dir: number
}) {
  return (
    <div className="flex h-10 items-baseline gap-1.5">
      {struck !== undefined && (
        <span className="font-mono text-muted-foreground text-sm tabular-nums line-through">
          ${struck}
        </span>
      )}
      <span className="flex items-baseline font-semibold text-4xl text-foreground tabular-nums">
        $
        <span className="inline-block overflow-hidden">
          {amount === undefined ? (
            <Pending width="w-10" />
          ) : (
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.span
                key={amount}
                custom={dir}
                variants={{
                  enter: (d: number) => ({
                    y: d * 28,
                    opacity: 0,
                    filter: "blur(3px)",
                  }),
                  center: { y: 0, opacity: 1, filter: "blur(0px)" },
                  exit: (d: number) => ({
                    y: d * -28,
                    opacity: 0,
                    filter: "blur(3px)",
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="inline-block"
              >
                {amount}
              </motion.span>
            </AnimatePresence>
          )}
        </span>
      </span>
      <span className="text-muted-foreground text-sm">{note}</span>
    </div>
  )
}

/* ----------------------------- comparison table ---------------------------- */

const GROUP_DESCRIPTION: Record<PlanGroupName, string> = {
  "Links and domains": "The core of the platform, on every plan.",
  Routing: "Where a click goes, decided by you.",
  Analytics: "Click insights without a separate tool.",
  Developer: "API-first, SDKs in every language we ship.",
}

const COLUMNS = ["free", "pro", "business"] as const

function CellValue({ cell }: { cell: PlanCell }) {
  switch (cell.kind) {
    case "value":
      return (
        <span className="flex items-center gap-1.5 text-foreground/90 text-sm tabular-nums">
          <Check className="size-3.5 shrink-0 text-foreground/70" />
          {cell.text}
        </span>
      )
    case "needs":
      return (
        <span className="font-mono text-[11px] text-muted-foreground/60">
          {cell.plan}
        </span>
      )
    case "later":
      return (
        <span className="font-mono text-[11px] text-muted-foreground">
          Coming later
        </span>
      )
    case "loading":
      return <Pending width="w-20" />
    default: {
      const _exhaustive: never = cell
      return _exhaustive
    }
  }
}

export function PricingTable() {
  const plans = usePlans()
  const groups = buildPlanGroups(plans.data?.plans)
  const cols = ["Free", "Pro", "Business"]
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[40rem]">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-border/60 border-b">
          <div className="p-4 font-medium text-muted-foreground text-sm">
            Features
          </div>
          {cols.map((c) => (
            <div
              key={c}
              className={cn(
                "p-4 text-center font-semibold text-foreground text-sm",
                c === "Pro" &&
                  "rounded-t-xl border-border/60 border-x border-t bg-card"
              )}
            >
              {c}
            </div>
          ))}
        </div>

        {groups.map((g) => (
          <React.Fragment key={g.name}>
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-border/40 border-b">
              <div className="px-4 pt-8 pb-3">
                <h4 className="font-semibold text-foreground text-sm tracking-tight">
                  {g.name}
                </h4>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {GROUP_DESCRIPTION[g.name]}
                </p>
              </div>
              <div />
              <div className="border-border/60 border-x bg-card" />
              <div />
            </div>
            {g.rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-border/40 border-b"
              >
                <div className="p-4 text-muted-foreground text-sm">
                  {row.label}
                </div>
                {COLUMNS.map((column) => (
                  <div
                    key={column}
                    className={cn(
                      "flex items-center justify-center p-4",
                      column === "pro" && "border-border/60 border-x bg-card"
                    )}
                  >
                    <CellValue cell={row.cells[column]} />
                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}

        {/* CTA footer row */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div />
          <div className="p-4">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
          <div className="rounded-b-xl border-border/60 border-x border-b bg-card p-4 shadow-card dark:shadow-[0_24px_48px_-32px_rgba(0,0,0,0.6)]">
            <Button asChild size="sm" className="w-full">
              <Link href="/signup?plan=pro">Start Pro</Link>
            </Button>
          </div>
          <div className="p-4">
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href="#business">Join the waitlist</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
