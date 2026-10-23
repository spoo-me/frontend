"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarClock, CreditCard } from "lucide-react"
import { toast } from "sonner"

import { createPortalSession, SpooApiError } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { usePlan } from "@/hooks/use-entitlements"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/dashboard/section"

/**
 * Plan chrome that only exists when something needs the user: the grace
 * banner (term ended, Pro continues until a date) and the named past_due
 * banner (a payment failed, Pro continues while the provider retries). Both
 * carry the portal link. Every other status renders nothing.
 */

export function PortalButton({
  children,
  size = "default",
}: {
  children: React.ReactNode
  size?: "default" | "sm"
}) {
  const [busy, setBusy] = React.useState(false)
  return (
    <Button
      variant="outline"
      size={size}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const { url } = await createPortalSession()
          window.location.assign(url)
        } catch (err) {
          toast.error(
            err instanceof SpooApiError
              ? err.message
              : "Couldn't open the billing portal."
          )
        } finally {
          setBusy(false)
        }
      }}
    >
      <CreditCard className="size-3.5" />
      {children}
    </Button>
  )
}

export function PlanBanner() {
  const plan = usePlan()
  if (!plan) return null
  if (plan.status === "grace") {
    return (
      <Banner
        icon={CalendarClock}
        title={`Your Pro term has ended. Pro stays on until ${formatDate(plan.until)}.`}
        body="After that the account goes back to Free. Nothing is deleted; Pro-only settings switch back on when you renew."
        action={
          <Button asChild>
            <Link href="/upgrade?from=plan&return=/dashboard">Renew</Link>
          </Button>
        }
      />
    )
  }
  if (plan.status === "past_due") {
    return (
      <Banner
        icon={CreditCard}
        title="Your last payment did not go through."
        body="Pro stays on while the payment is retried. Update the card in the billing portal to keep it."
        action={<PortalButton>Update payment method</PortalButton>}
      />
    )
  }
  return null
}

function Banner({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <Panel className="mb-6 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-0.5">
          <p className="font-medium text-foreground text-sm">{title}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {body}
          </p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </Panel>
  )
}
