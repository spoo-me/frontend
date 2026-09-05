"use client"

import * as React from "react"
import {
  ChartLine,
  Check,
  ChevronDown,
  KeyRound,
  Link2,
  Route,
  type LucideIcon,
} from "lucide-react"

import type { Cadence, PlansResponse } from "@/lib/api"
import { formatLimit } from "@/lib/entitlements/copy"
import { formatDate } from "@/lib/format"
import {
  buildPlanGroups,
  foundingIsOpen,
  foundingRemaining,
  yearlySavingPercent,
  type PlanCell,
  type PlanColumn,
  type PlanGroupName,
} from "@/lib/plan-table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/components/dashboard/segmented"
import { ProMark } from "./pro-mark"
import { WaitlistForm } from "./waitlist-form"

/**
 * The one plan table, on /pricing and /upgrade alike: a top bar with the
 * cadence switch, three plan columns full width, then feature groups whose
 * cells show the value per plan. Pro is the tinted column. Every number
 * comes from GET /api/v1/plans; the callers only decide the buttons.
 */
const COLUMNS: PlanColumn[] = ["free", "pro", "business"]
const COLUMN_NAME: Record<PlanColumn, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
}
const GROUP_ICON: Record<PlanGroupName, LucideIcon> = {
  "Links and domains": Link2,
  Routing: Route,
  Analytics: ChartLine,
  Developer: KeyRound,
}

/** Label column plus three equal plan columns; the same track on every row. */
const GRID = "lg:grid lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]"
const PRO_COLUMN = "lg:border-x lg:border-brand/25 lg:bg-brand/[0.045]"

export function PlanTable({
  title,
  subtitle,
  plans,
  loading,
  cadence,
  onCadence,
  freeAction,
  proAction,
  waitlistEmail = "",
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  plans: PlansResponse | undefined
  loading: boolean
  cadence: Cadence
  onCadence: (c: Cadence) => void
  /** What the Free header offers: a button, or a mono "Your plan". */
  freeAction: React.ReactNode
  /** What the Pro header offers: signup, checkout, or the billing portal. */
  proAction: React.ReactNode
  waitlistEmail?: string
  className?: string
}) {
  const saving = yearlySavingPercent(plans?.prices)
  const groups = buildPlanGroups(plans?.plans)
  const [closed, setClosed] = React.useState<Set<PlanGroupName>>(new Set())
  const toggle = (name: PlanGroupName) =>
    setClosed((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">{title}</div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            {saving !== null ? `save ${saving}% paid yearly` : ""}
          </span>
          <Segmented
            value={cadence}
            onChange={onCadence}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "year", label: "One year" },
            ]}
          />
        </div>
      </div>
      {subtitle && (
        <div className="mt-1 max-w-xl text-muted-foreground text-sm">
          {subtitle}
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-border/60 bg-card">
        <div
          className={cn(
            "grid gap-px bg-border/60 lg:gap-0 lg:bg-transparent",
            GRID
          )}
        >
          <div className="hidden bg-card lg:block" />
          <PlanHeader
            column="free"
            plans={plans}
            loading={loading}
            cadence={cadence}
          >
            {freeAction}
          </PlanHeader>
          <PlanHeader
            column="pro"
            plans={plans}
            loading={loading}
            cadence={cadence}
          >
            {proAction}
          </PlanHeader>
          <PlanHeader
            column="business"
            plans={plans}
            loading={loading}
            cadence={cadence}
          >
            {/* Keyed so the account email lands in the field once the session loads. */}
            <WaitlistForm key={waitlistEmail} defaultEmail={waitlistEmail} />
          </PlanHeader>
        </div>

        {groups.map((group) => {
          const Icon = GROUP_ICON[group.name]
          const open = !closed.has(group.name)
          return (
            <section key={group.name} className="border-border/60 border-t">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(group.name)}
                className={cn(
                  "flex w-full text-left text-foreground text-sm transition-colors duration-150 hover:bg-muted/40",
                  GRID
                )}
              >
                <span className="flex items-center gap-2 px-4 py-3">
                  <Icon
                    className="size-4 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <span className="font-medium">{group.name}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-muted-foreground transition-transform duration-200",
                      !open && "-rotate-90"
                    )}
                  />
                </span>
                <span className="hidden lg:block" />
                <span className={cn("hidden lg:block", PRO_COLUMN)} />
                <span className="hidden lg:block" />
              </button>
              {open &&
                group.rows.map((row) => (
                  <div
                    key={row.label}
                    className={cn(
                      "border-border/60 border-t px-4 py-3 lg:px-0 lg:py-0",
                      GRID
                    )}
                  >
                    <span className="block text-foreground text-sm lg:px-4 lg:py-3">
                      {row.label}
                    </span>
                    <div className="mt-2 grid grid-cols-3 gap-2 lg:contents">
                      {COLUMNS.map((column) => (
                        <div
                          key={column}
                          className={cn(
                            "min-w-0 lg:flex lg:items-center lg:px-4 lg:py-3",
                            column === "pro" && PRO_COLUMN
                          )}
                        >
                          <span className="label-mono block text-muted-foreground/50 lg:hidden">
                            {COLUMN_NAME[column]}
                          </span>
                          <Cell cell={row.cells[column]} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function PlanHeader({
  column,
  plans,
  loading,
  cadence,
  children,
}: {
  column: PlanColumn
  plans: PlansResponse | undefined
  loading: boolean
  cadence: Cadence
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col bg-card p-5",
        column === "pro" && PRO_COLUMN,
        column === "pro" &&
          "border-brand/25 max-lg:border max-lg:bg-brand/[0.045]"
      )}
    >
      <span className="flex items-center gap-2">
        <span className="font-semibold text-base text-foreground">
          {COLUMN_NAME[column]}
        </span>
        {column === "pro" && <ProMark />}
      </span>
      <div className="mt-4 min-h-[68px]">
        <Price
          column={column}
          plans={plans}
          loading={loading}
          cadence={cadence}
        />
      </div>
      <div className="mt-4 min-h-9">{children}</div>
      <span className="label-mono mt-6 text-muted-foreground/60">Includes</span>
      <ul className="mt-2 space-y-1.5">
        {includes(column, plans).map((line) => (
          <li
            key={line}
            className="flex items-start gap-2 text-muted-foreground text-sm"
          >
            <Check
              className="mt-1 size-3.5 shrink-0 text-foreground/70"
              strokeWidth={2}
            />
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

function includes(
  column: PlanColumn,
  plans: PlansResponse | undefined
): string[] {
  const free = plans?.plans.find((p) => p.name === "free")
  const pro = plans?.plans.find((p) => p.name === "pro")
  const history = (n: number | undefined) =>
    n === undefined
      ? "Analytics history"
      : `${formatLimit("analytics_window_days", n)} of analytics`
  switch (column) {
    case "free":
      return [
        "Unlimited links and clicks",
        history(free?.limits.analytics_window_days),
        "API, SDKs and webhooks",
      ]
    case "pro":
      return [
        "Everything in Free",
        "Your domain, your preview card, your routing rules",
        history(pro?.limits.analytics_window_days),
      ]
    case "business":
      return ["Everything in Pro", "Team seats", "Conversion tracking"]
  }
}

function Price({
  column,
  plans,
  loading,
  cadence,
}: {
  column: PlanColumn
  plans: PlansResponse | undefined
  loading: boolean
  cadence: Cadence
}) {
  const unit = cadence === "monthly" ? "/ month" : "/ year"
  if (column === "free")
    return (
      <>
        <Amount>0</Amount>
        <Note>no card</Note>
      </>
    )
  if (column === "business")
    return (
      <span className="block pt-3 font-mono text-[11px] text-muted-foreground">
        Coming later
      </span>
    )
  const list = plans?.prices[cadence]
  const founding = plans?.founding ?? null
  const now = Date.now()
  if (foundingIsOpen(founding, now)) {
    const price = founding[cadence]
    return (
      <>
        <span className="flex items-end gap-2">
          {list && (
            <span className="pb-1 font-mono text-muted-foreground text-sm tabular-nums line-through">
              ${list.amount}
            </span>
          )}
          <Amount>{price.amount}</Amount>
          <Note>{unit}</Note>
        </span>
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground tabular-nums">
          {foundingRemaining(founding, now)}, until {formatDate(founding.until)}
        </p>
        <p className="mt-1 text-foreground text-xs">
          This price stays yours while you stay subscribed.
        </p>
      </>
    )
  }
  if (!list)
    return (
      <span className="block pt-3 font-mono text-[11px] text-muted-foreground">
        {loading ? "loading" : "Prices unavailable"}
      </span>
    )
  return (
    <>
      <Amount>{list.amount}</Amount>
      <Note>{unit}</Note>
    </>
  )
}

function Amount({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-semibold text-4xl text-foreground tabular-nums tracking-tight">
      <span className="font-normal font-serif text-muted-foreground italic">
        $
      </span>
      {children}
    </span>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
      {children}
    </span>
  )
}

function Cell({ cell }: { cell: PlanCell }) {
  switch (cell.kind) {
    case "value":
      return (
        <span className="flex items-center gap-1.5 font-mono text-[12px] text-foreground tabular-nums">
          <Check
            className="size-3.5 shrink-0 text-foreground/70"
            strokeWidth={2}
          />
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
      return (
        <span className="inline-block h-3 w-24 animate-pulse rounded bg-primary/10" />
      )
    default: {
      const _exhaustive: never = cell
      return _exhaustive
    }
  }
}
