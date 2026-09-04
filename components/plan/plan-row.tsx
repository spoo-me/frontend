"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import type { PlanStatus } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { usePlan } from "@/hooks/use-entitlements"
import { Button } from "@/components/ui/button"
import { PortalButton } from "./plan-banner"
import { ProMark } from "./pro-mark"

/**
 * The settings "Plan" row: the plan name, its status and end date in muted
 * mono, the founding marker as a word, and the one action that fits (an
 * upgrade link on Free, the billing portal on Pro).
 */
/** Statuses whose date means something to the reader, and the word before it. */
const DATED_STATUS: Partial<Record<PlanStatus, string>> = {
  active: "ends",
  cancel_at_period_end: "ends",
  grace: "grace until",
}

export function PlanRow() {
  const plan = usePlan()
  if (!plan) return null
  const pro = plan.name === "pro"
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase">
        {pro ? <ProMark /> : <span className="text-foreground">free</span>}
        {plan.status && plan.until && DATED_STATUS[plan.status] && (
          <span className="normal-case">
            {plan.renews ? "renews" : DATED_STATUS[plan.status]}{" "}
            {formatDate(plan.until)}
          </span>
        )}
        {plan.status === "past_due" && (
          <span className="normal-case">payment failed</span>
        )}
        {plan.founding && <span className="normal-case">founding member</span>}
      </span>
      {pro && plan.status !== "lapsed" ? (
        <PortalButton size="sm">Manage billing</PortalButton>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href="/upgrade?from=plan&return=/dashboard/settings">
            Upgrade to Pro
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      )}
    </div>
  )
}
