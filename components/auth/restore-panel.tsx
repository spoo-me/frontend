"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Check } from "lucide-react"

import { restoreAccount } from "@/lib/api"
import { Button } from "@/components/ui/button"

type Phase = "idle" | "pending" | "restored" | "failed"

/**
 * The cancel-deletion landing from the notice email. Restoring only happens
 * on the button press: mail scanners prefetch links, and a GET must never
 * consume the one-shot token or flip the account.
 */
export function RestorePanel({ token }: { token: string | null }) {
  const [phase, setPhase] = React.useState<Phase>(token ? "idle" : "failed")

  const restore = () => {
    if (!token || phase === "pending") return
    setPhase("pending")
    restoreAccount({ restore_token: token }).then(
      () => setPhase("restored"),
      () => setPhase("failed")
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="space-y-7"
    >
      {phase === "restored" ? (
        <>
          <div className="space-y-2 text-center">
            <span className="mx-auto flex size-9 items-center justify-center rounded-full bg-live/10">
              <Check className="size-4 text-live" aria-hidden />
            </span>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              Account restored
            </h1>
            <p className="text-muted-foreground text-sm">
              The deletion is cancelled and everything is back where you left
              it. Sign in to continue.
            </p>
          </div>
          <Button asChild className="h-10 w-full">
            <Link href="/login">
              Sign in
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
        </>
      ) : phase === "failed" ? (
        <>
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              This link is not valid
            </h1>
            <p className="text-muted-foreground text-sm">
              It may have expired or already been used. If your account is still
              scheduled for deletion, sign in with your password to restore it,
              or email{" "}
              <a
                href="mailto:support@spoo.me"
                className="text-foreground underline underline-offset-4"
              >
                support@spoo.me
              </a>
              .
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 w-full">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              Restore your account
            </h1>
            <p className="text-muted-foreground text-sm">
              Your account is scheduled for deletion. Cancel it here and keep
              your links, analytics and settings.
            </p>
          </div>
          <Button
            className="h-10 w-full"
            disabled={phase === "pending"}
            onClick={restore}
          >
            {phase === "pending" ? "Restoring…" : "Restore my account"}
          </Button>
        </>
      )}
    </motion.div>
  )
}
