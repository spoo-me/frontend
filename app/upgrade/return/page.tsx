"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { trackUpgradeCompleted } from "@/lib/analytics"
import {
  clearStashedVersion,
  PATIENCE_MS,
  paymentLanded,
  planIsPaid,
  POLL_INTERVAL_MS,
  readStashedVersion,
  safeReturnPath,
} from "@/lib/entitlements/return-flow"
import { useEntitlements } from "@/hooks/use-entitlements"

/**
 * Where checkout sends the browser back. Polls the entitlements every two
 * seconds until the server's version moves past the one the user left
 * with and the plan reads as paid, then lands on the page that sent them.
 * Past a minute it says so calmly and keeps polling; a webhook can be late,
 * never wrong.
 */
export default function UpgradeReturnPage() {
  const router = useRouter()
  const params = useSearchParams()
  const returnTo = safeReturnPath(params.get("return"))
  const from = params.get("from")
  const { entitlements, refresh } = useEntitlements()
  const baseline = React.useRef<number | null>(null)
  const started = React.useRef(Date.now())
  const [patient, setPatient] = React.useState(false)
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    baseline.current = readStashedVersion()
  }, [])

  React.useEffect(() => {
    if (done) return
    const version = entitlements?.version
    const paid = planIsPaid(entitlements?.plan)
    // No stash (a fresh tab): the first answer we see is the baseline, and
    // an already-paid answer is the landing.
    if (baseline.current === null && version !== undefined) {
      if (paid) {
        finish()
        return
      }
      baseline.current = version
    }
    if (paid && paymentLanded(baseline.current, version)) finish()

    function finish() {
      setDone(true)
      clearStashedVersion()
      trackUpgradeCompleted({
        waited_ms: Date.now() - started.current,
        ...(from ? { from } : {}),
      })
      router.replace(returnTo)
    }
  }, [entitlements, done, from, returnTo, router])

  React.useEffect(() => {
    if (done) return
    const poll = window.setInterval(() => {
      void refresh()
      if (Date.now() - started.current > PATIENCE_MS) setPatient(true)
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(poll)
  }, [done, refresh])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <LoaderCircle
        className="size-5 animate-spin text-muted-foreground"
        aria-hidden
      />
      <div className="space-y-1">
        <p className="font-medium text-foreground text-sm">
          {patient
            ? "Still confirming your payment"
            : "Confirming your payment"}
        </p>
        <p className="max-w-xs text-muted-foreground text-xs leading-relaxed">
          {patient
            ? "The payment provider is taking longer than usual to confirm. This page keeps checking; you can also come back later, Pro switches on the moment it lands."
            : "This takes a few seconds. You will land back where you were, with Pro switched on."}
        </p>
      </div>
    </div>
  )
}
