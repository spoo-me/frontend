"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, CircleCheck } from "@/components/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requestPasswordReset, resetPassword, SpooApiError } from "@/lib/api"
import { PASSWORD_RULES, passwordSatisfies } from "@/lib/validation"

type Phase = "request" | "reset" | "done"

const RESEND_COOLDOWN = 30

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: "easeOut" as const },
}

export function ForgotPasswordForm() {
  const [phase, setPhase] = React.useState<Phase>("request")
  const [email, setEmail] = React.useState("")
  const [code, setCode] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown > 0])

  async function requestCode() {
    setPending(true)
    setError(null)
    try {
      await requestPasswordReset(email)
      setPhase("reset")
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      if (err instanceof SpooApiError && err.isRateLimit) {
        setError("Too many attempts. Wait a bit and try again.")
      } else if (err instanceof SpooApiError) {
        setError(err.message)
      } else {
        setError("Can't reach the server. Check your connection and try again.")
      }
    } finally {
      setPending(false)
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await resetPassword({ email, code, password })
      setPhase("done")
    } catch (err) {
      if (err instanceof SpooApiError && err.code === "validation_error") {
        setError(
          err.field === "code" || /code/i.test(err.message)
            ? "That code is invalid or has expired. Request a new one below."
            : err.message
        )
      } else if (err instanceof SpooApiError && err.isRateLimit) {
        setError("Too many attempts. Wait a bit and try again.")
      } else if (err instanceof SpooApiError) {
        setError(err.message)
      } else {
        setError("Can't reach the server. Check your connection and try again.")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {phase === "done" ? (
        <motion.div key="done" {...fade} className="space-y-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-live/30 bg-live/10">
            <CircleCheck className="size-5 text-live" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              Password updated
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your new password is live. Sign in to get back to your links.
            </p>
          </div>
          <Button asChild className="h-10 w-full">
            <Link href={`/login?email=${encodeURIComponent(email)}`}>
              Sign in
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
        </motion.div>
      ) : phase === "reset" ? (
        <motion.div key="reset" {...fade} className="space-y-7">
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              Check your inbox
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{email}</span>, a
              6-digit code is on its way.
            </p>
          </div>

          <form onSubmit={submitReset} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reset-code"
                className="font-medium text-foreground text-sm"
              >
                Reset code
              </label>
              <Input
                id="reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                required
                className="h-10 text-center font-mono text-base tracking-[0.4em]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reset-password"
                className="font-medium text-foreground text-sm"
              >
                New password
              </label>
              <Input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                className="h-10"
              />
              {password.length > 0 && (
                <ul
                  className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1"
                  aria-label="Password requirements"
                >
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password)
                    return (
                      <li
                        key={rule.id}
                        className={cn(
                          "flex items-center gap-1.5 text-xs transition-colors",
                          ok ? "text-live" : "text-muted-foreground/60"
                        )}
                      >
                        <Check
                          className={cn("size-3 shrink-0", !ok && "opacity-30")}
                          aria-hidden
                        />
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="h-10 w-full"
              disabled={
                pending || code.length !== 6 || !passwordSatisfies(password)
              }
            >
              {pending ? "Updating…" : "Set new password"}
              {!pending && (
                <ArrowRight className="size-4" data-icon="inline-end" />
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm">
            Didn&apos;t get it?{" "}
            {cooldown > 0 ? (
              <span className="text-muted-foreground/70 tabular-nums">
                Resend in {cooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void requestCode()}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Resend code
              </button>
            )}
          </p>
        </motion.div>
      ) : (
        <motion.div key="form" {...fade} className="space-y-7">
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              Reset your password
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your email and we&apos;ll send you a reset code.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void requestCode()
            }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reset-email"
                className="font-medium text-foreground text-sm"
              >
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
                aria-invalid={!!error || undefined}
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
              disabled={pending || !email}
            >
              {pending ? "Sending code…" : "Send reset code"}
              {!pending && (
                <ArrowRight className="size-4" data-icon="inline-end" />
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
