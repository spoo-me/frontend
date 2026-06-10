"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { CircleCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useAuth } from "@/components/auth/auth-context"
import { sendVerification, SpooApiError, verifyEmail } from "@/lib/api"

const RESEND_COOLDOWN = 60 // backend allows 1/min
const SPAM_HINT_DELAY = 25_000

export function VerifyStep({ onDone }: { onDone: () => void }) {
  const { user, refresh, signOut } = useAuth()
  const router = useRouter()
  const [code, setCode] = React.useState("")
  const [status, setStatus] = React.useState<
    "idle" | "verifying" | "success" | "error"
  >("idle")
  const [error, setError] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState(0)
  const [resent, setResent] = React.useState(false)
  const [spamHint, setSpamHint] = React.useState(false)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown > 0])

  // Progressive disclosure — only mention spam folders once it's plausible
  // the email actually didn't arrive.
  React.useEffect(() => {
    const t = setTimeout(() => setSpamHint(true), SPAM_HINT_DELAY)
    return () => clearTimeout(t)
  }, [])

  const succeed = React.useCallback(() => {
    setStatus("success")
    setError(null)
    // Hold the success state long enough to register, then advance.
    setTimeout(onDone, 900)
  }, [onDone])

  // Cross-tab sync: if the user verifies in another tab (e.g. the legacy
  // /auth/verify page), re-check the session whenever this tab regains
  // focus and advance with the same success choreography.
  React.useEffect(() => {
    if (status === "success") return
    async function revalidate() {
      if (document.visibilityState !== "visible") return
      const fresh = await refresh()
      if (fresh?.email_verified) succeed()
    }
    window.addEventListener("focus", revalidate)
    document.addEventListener("visibilitychange", revalidate)
    return () => {
      window.removeEventListener("focus", revalidate)
      document.removeEventListener("visibilitychange", revalidate)
    }
  }, [status, refresh, succeed])

  async function submit(value: string) {
    if (status === "verifying" || status === "success") return
    setStatus("verifying")
    setError(null)
    try {
      await verifyEmail(value)
      await refresh() // new cookies carry email_verified: true
      succeed()
    } catch (err) {
      setCode("")
      setStatus("error")
      if (err instanceof SpooApiError && err.status === 400) {
        setError("That code didn't work — it may have expired. Try again or resend.")
      } else if (err instanceof SpooApiError && err.isRateLimit) {
        setError("Too many attempts. Wait a minute, then try again.")
      } else {
        setError("Couldn't verify right now. Check your connection and try again.")
      }
    }
  }

  async function resend() {
    setError(null)
    try {
      await sendVerification()
      setResent(true)
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      if (err instanceof SpooApiError && err.isRateLimit) {
        setError("Resend limit reached. Wait a bit before requesting another code.")
        setCooldown(RESEND_COOLDOWN)
      } else {
        setError("Couldn't send the code. Try again in a moment.")
      }
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Verify your email
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        Enter the 6-digit code sent to{" "}
        <span className="text-foreground font-medium break-all">
          {user?.email}
        </span>
      </p>
      <button
        type="button"
        onClick={() => {
          void signOut().then(() => router.push("/signup"))
        }}
        className="text-muted-foreground/70 hover:text-foreground mt-1.5 text-xs underline-offset-4 transition-colors hover:underline"
      >
        Wrong email? Start over
      </button>

      <motion.div
        key={status === "error" ? `err-${error}` : "ok"}
        animate={
          status === "error" ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }
        }
        transition={{ duration: 0.3 }}
        className="mt-9"
      >
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v)
            if (status === "error") {
              setStatus("idle")
              setError(null)
            }
          }}
          onComplete={(v: string) => void submit(v)}
          pasteTransformer={(p) => p.replaceAll(/\D/g, "")}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          disabled={status === "verifying" || status === "success"}
          aria-label="Verification code"
          aria-invalid={status === "error" || undefined}
        >
          <InputOTPGroup>
            {[0, 1, 2].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                aria-invalid={status === "error" || undefined}
                className={cn(status === "success" && "border-live/60 ring-live/20 ring-2")}
              />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {[3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                aria-invalid={status === "error" || undefined}
                className={cn(status === "success" && "border-live/60 ring-live/20 ring-2")}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </motion.div>

      {/* Status line — fixed height so the layout never jumps */}
      <div className="mt-5 flex h-6 items-center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {status === "success" ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-live inline-flex items-center gap-1.5 text-sm font-medium"
            >
              <CircleCheck className="size-4" /> Verified
            </motion.span>
          ) : status === "verifying" ? (
            <motion.span
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-sm"
            >
              Verifying…
            </motion.span>
          ) : error ? (
            <motion.span
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
              className="text-destructive text-sm"
            >
              {error}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <p className="text-muted-foreground mt-4 text-sm">
        Didn&apos;t receive a code?{" "}
        {cooldown > 0 ? (
          <span className="text-muted-foreground/70 tabular-nums">
            {resent ? "Code sent. " : ""}Resend in {cooldown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void resend()}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Resend
          </button>
        )}
      </p>

      <AnimatePresence>
        {spamHint && status !== "success" && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground/70 mt-8 max-w-xs text-xs leading-relaxed"
          >
            Can&apos;t find it? Check your spam folder — Gmail sometimes files
            codes under Promotions.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
