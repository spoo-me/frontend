"use client"

import * as React from "react"
import Link from "next/link"
import Script from "next/script"
import { useRouter, useSearchParams } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { PADDLE_CLIENT_TOKEN, PADDLE_ENV } from "@/lib/flags"
import { useAuth } from "@/components/auth/auth-context"
import { safeReturnPath } from "@/lib/entitlements/return-flow"

/**
 * Paddle's default payment link points here. The backend already created
 * the transaction (with the price, the discount and the return path in
 * custom_data); this page only opens the Paddle.js overlay for it and tells
 * Paddle where to send the browser afterwards. Closing the overlay goes
 * back to the plan page it came from.
 */
type PaddleJs = {
  Environment: { set: (env: "sandbox" | "production") => void }
  Initialize: (opts: {
    token: string
    eventCallback?: (event: { name: string }) => void
  }) => void
  Checkout: {
    open: (opts: {
      transactionId: string
      customer?: { email: string }
      settings: { displayMode: "overlay"; successUrl: string }
    }) => void
  }
}

declare global {
  interface Window {
    Paddle?: PaddleJs
  }
}

// Paddle.js keeps its state on window; Initialize runs once per page load.
let initialized = false

export default function UpgradeCheckoutPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useAuth()
  const email = user?.email
  const transactionId = params.get("_ptxn")
  const returnTo = safeReturnPath(params.get("return"))
  const from = params.get("from")
  const [ready, setReady] = React.useState(false)
  const [problem, setProblem] = React.useState<string | null>(null)
  const completed = React.useRef(false)

  const query = React.useMemo(() => {
    const q = new URLSearchParams({ return: returnTo })
    if (from) q.set("from", from)
    return q.toString()
  }, [returnTo, from])
  const plansHref = `/upgrade?${query}`

  React.useEffect(() => {
    if (!ready) return
    if (!transactionId) {
      setProblem("This checkout link is missing its transaction.")
      return
    }
    if (!PADDLE_CLIENT_TOKEN || !PADDLE_ENV || !window.Paddle) {
      setProblem("Checkout is not configured on this deployment.")
      return
    }
    if (!initialized) {
      initialized = true
      window.Paddle.Environment.set(PADDLE_ENV)
      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (event) => {
          if (event.name === "checkout.completed") completed.current = true
          if (event.name === "checkout.closed" && !completed.current)
            router.replace(plansHref)
        },
      })
    }
    window.Paddle.Checkout.open({
      transactionId,
      ...(email ? { customer: { email } } : {}),
      settings: {
        displayMode: "overlay",
        successUrl: `${window.location.origin}/upgrade/return?${query}`,
      },
    })
  }, [ready, transactionId, query, plansHref, email, router])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setProblem("The payment form could not load.")}
      />
      {problem ? (
        <p className="max-w-xs text-muted-foreground text-sm">{problem}</p>
      ) : (
        <>
          <LoaderCircle
            className="size-5 animate-spin text-muted-foreground"
            aria-hidden
          />
          <p className="font-medium text-foreground text-sm">
            Opening checkout
          </p>
        </>
      )}
      <Link
        href={plansHref}
        className="font-mono text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        Back to plans
      </Link>
    </div>
  )
}
