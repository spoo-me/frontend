"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ArrowRight, CircleCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Status = "idle" | "sending" | "sent" | "error"

const RESEND_COOLDOWN = 30

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<Status>("idle")
  const [error, setError] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown > 0])

  async function requestReset() {
    setStatus("sending")
    setError(null)
    try {
      const res = await fetch("https://spoo.me/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus("sent")
        setCooldown(RESEND_COOLDOWN)
      } else if (res.status === 429) {
        setStatus("error")
        setError("Too many attempts. Wait a minute and try again.")
      } else {
        // The API returns structured {error, code, field} bodies — surface them
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setStatus("error")
        setError(data?.error ?? "Something went wrong on our end. Try again in a moment.")
      }
    } catch {
      // CORS/network blocked — hand off to the app's own reset flow
      window.location.href = `https://spoo.me/login?email=${encodeURIComponent(email)}`
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    void requestReset()
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "sent" ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6 text-center"
        >
          <div className="border-live/30 bg-live/10 mx-auto flex size-12 items-center justify-center rounded-full border">
            <CircleCheck className="text-live size-5" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
              Check your inbox
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If an account exists for{" "}
              <span className="text-foreground font-medium">{email}</span>, a reset
              code is on its way. It expires in 15 minutes.
            </p>
          </div>
          <Button asChild className="h-10 w-full">
            <a href="https://spoo.me/login">
              Continue on spoo.me
              <ArrowRight className="size-4" data-icon="inline-end" />
            </a>
          </Button>
          <p className="text-muted-foreground text-sm">
            Didn&apos;t get it?{" "}
            {cooldown > 0 ? (
              <span className="text-muted-foreground/70 tabular-nums">
                Resend in {cooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void requestReset()}
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Resend code
              </button>
            )}
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-7"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
              Reset your password
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your email and we&apos;ll send you a reset code.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-email" className="text-foreground text-sm font-medium">
                Email
              </label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                required
                aria-invalid={status === "error" || undefined}
                className="h-10"
              />
              {error && (
                <p role="alert" className="text-destructive text-xs">
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="h-10 w-full"
              disabled={status === "sending" || !email}
            >
              {status === "sending" ? "Sending code…" : "Send reset code"}
              {status !== "sending" && (
                <ArrowRight className="size-4" data-icon="inline-end" />
              )}
            </Button>
          </form>

          <p className="text-muted-foreground text-center text-sm">
            Remembered it?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
