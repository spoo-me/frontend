"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrandIcons } from "@/components/icons/brand-icons"
import { useAuth } from "@/components/auth/auth-context"
import { VerifyPanel } from "@/components/auth/verify-panel"
import { trackLoggedIn, trackSignedUp } from "@/lib/analytics"
import { login, register, restoreAccount, SpooApiError } from "@/lib/api"
import { PASSWORD_RULES, passwordSatisfies, safeNext } from "@/lib/validation"
import { planFromSearch, stashSignupPlan } from "@/lib/signup-plan"

type Mode = "login" | "signup"

// Sign in with Spoo parks users here mid-handshake with an external app;
// a ?next= into the consent page must survive every post-auth route.
const CONSENT_PATH = "/auth/device/login"

function isConsentPath(next: string | null): next is string {
  // Exact, not a prefix: startsWith would also accept /auth/device/loginfoo.
  return (
    next === CONSENT_PATH || (next?.startsWith(`${CONSENT_PATH}?`) ?? false)
  )
}

function consentNext(): string | null {
  const next = safeNext(new URLSearchParams(window.location.search).get("next"))
  return isConsentPath(next) ? next : null
}

// The consent page is a backend route behind the /auth proxy, not a Next
// one. Handing it to the client router makes it probe with an RSC fetch
// before falling back to a real navigation, and on the auto-approve branch
// that probe mints and delivers a device code by itself.
function leaveForConsent(next: string) {
  window.location.assign(next)
}

// The URL's ?next= never changes within a page view — subscribe to nothing,
// snapshot once (strings are value-compared, so re-reads are stable).
const subscribeNever = () => () => {}

function readNextQS(): string {
  const next = safeNext(new URLSearchParams(window.location.search).get("next"))
  return next ? `?next=${encodeURIComponent(next)}` : ""
}

const copy: Record<
  Mode,
  {
    title: string
    sub: string
    cta: string
    pending: string
    alt: string
    altLink: string
    altHref: string
  }
> = {
  login: {
    title: "Welcome back",
    sub: "Sign in to your spoo.me workspace.",
    cta: "Sign in",
    pending: "Signing in…",
    alt: "Don't have an account?",
    altLink: "Create one",
    altHref: "/signup",
  },
  signup: {
    title: "Create your account",
    sub: "Start free. Upgrade when your links do.",
    cta: "Create account",
    pending: "Creating account…",
    alt: "Already have an account?",
    altLink: "Sign in",
    altHref: "/login",
  },
}

const providers = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "github", label: "GitHub", Icon: BrandIcons.github },
  { id: "discord", label: "Discord", Icon: BrandIcons.discord },
] as const

export function AuthForm({ mode }: { mode: Mode }) {
  const c = copy[mode]
  const router = useRouter()
  const { user, loading, setUser, signOut } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [conflict, setConflict] = React.useState(false)
  // A pending-deletion 403 turns the same credentials into a restore proof.
  const [restorable, setRestorable] = React.useState(false)
  // Dub-style: the OTP panel swaps into this pane right after signup —
  // verification gates entry instead of being an onboarding step.
  const [verifying, setVerifying] = React.useState(false)
  // ?next= must survive the login↔signup cross-link and the OAuth 302
  // chain (the backend threads it through OAuth state and resumes it).
  // useSyncExternalStore: statically rendered page, window is client-only.
  const nextQS = React.useSyncExternalStore(
    subscribeNever,
    readNextQS,
    () => ""
  )

  // /pricing sends "Start Pro" here with ?plan=pro; onboarding consumes it.
  React.useEffect(() => {
    if (mode === "signup")
      stashSignupPlan(planFromSearch(window.location.search))
  }, [mode])

  // An active session has no business on the auth forms: route it by
  // account state. Suspended while the OTP panel owns the pane (a fresh
  // registration IS a session) and while a submit is settling.
  React.useEffect(() => {
    if (loading || !user || verifying || pending) return
    // A device-auth consent resume outranks account-state routing: the
    // user is mid-handshake with an external app — close that loop first,
    // onboarding waits for their first organic dashboard visit.
    const consent = consentNext()
    if (consent) {
      leaveForConsent(consent)
      return
    }
    if (!user.email_verified || !user.onboarded_at) {
      router.replace("/onboarding")
    } else {
      router.replace("/dashboard")
    }
  }, [loading, user, verifying, pending, router])

  // Dub-style progressive reveal: the password field appears once the
  // email reads as one — the form starts as a single calm field.
  const emailLooksValid = /\S+@\S+\.\S+/.test(email)
  const canSubmit =
    emailLooksValid &&
    (mode === "login" ? password.length > 0 : passwordSatisfies(password))

  async function finishLogin() {
    const { user } = await login({ email, password })
    trackLoggedIn("password")
    setUser(user)
    // Read ?next= at submit time — avoids the useSearchParams Suspense
    // requirement on an otherwise static page.
    const next = safeNext(
      new URLSearchParams(window.location.search).get("next")
    )
    // Unfinished accounts resume where they left off: the onboarding
    // layout owns the verify gate and the step cache, so one push
    // covers unverified, mid-wizard, and fresh states alike. The one
    // exception is a device-auth consent resume — see the effect above.
    if (isConsentPath(next)) {
      leaveForConsent(next)
    } else if (!user.email_verified || !user.onboarded_at) {
      router.push("/onboarding")
    } else {
      router.push(next ?? "/dashboard")
    }
  }

  async function onRestore() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await restoreAccount({ email, password })
      setRestorable(false)
      await finishLogin()
    } catch {
      setPending(false)
      setError(
        "Couldn't restore the account. Use the link from the deletion email, or contact support@spoo.me."
      )
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || pending) return
    setPending(true)
    setError(null)
    setConflict(false)
    setRestorable(false)
    try {
      if (mode === "login") {
        await finishLogin()
      } else {
        const { user } = await register({ email, password })
        trackSignedUp("password")
        setUser(user)
        setPending(false)
        setVerifying(true)
      }
    } catch (err) {
      setPending(false)
      if (err instanceof SpooApiError) {
        if (err.status === 409) {
          setConflict(true)
          setError("This email already has an account.")
        } else if (err.isRateLimit) {
          setError("Too many attempts. Wait a minute and try again.")
        } else if (err.code === "authentication_error") {
          setError("Invalid email or password.")
        } else if (err.code === "account_pending_deletion") {
          setRestorable(true)
          setError("This account is scheduled for deletion.")
        } else {
          setError(err.message)
        }
      } else {
        setError("Can't reach the server. Check your connection and try again.")
      }
    }
  }

  if (verifying) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <VerifyPanel
          onDone={() => {
            const consent = consentNext()
            if (consent) leaveForConsent(consent)
            else router.push("/onboarding/welcome")
          }}
          onRestart={() => {
            void signOut().then(() => {
              setVerifying(false)
              setPassword("")
            })
          }}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="space-y-7"
    >
      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">
          {c.title}
        </h1>
        <p className="text-muted-foreground text-sm">{c.sub}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {providers.map(({ id, label, Icon }) => (
          <Button key={id} asChild variant="outline" className="h-10 w-full">
            {/* Full-page navigation through the same-origin proxy — the
                OAuth flow needs the backend session cookie + 302 chain.
                Without a next the backend routes new accounts to
                /onboarding and existing ones to /dashboard; with one it
                resumes it (device-consent links must not be hijacked). */}
            <a
              href={`/oauth/${id}${nextQS}`}
              aria-label={`Continue with ${label}`}
            >
              <Icon className="size-4" data-icon="inline-start" />
              {label}
            </a>
          </Button>
        ))}
      </div>

      <div
        className="flex items-center gap-3"
        role="separator"
        aria-label="or continue with email"
      >
        <span className="h-px flex-1 bg-border/60" />
        <span className="label-mono text-[10px] text-muted-foreground/70">
          or continue with
        </span>
        <span className="h-px flex-1 bg-border/60" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="auth-email"
              className="font-medium text-foreground text-sm"
            >
              Email
            </label>
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            required
            className="h-10"
          />
        </div>

        <AnimatePresence initial={false}>
          {emailLooksValid && (
            <motion.div
              key="password"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="-mx-1 overflow-hidden px-1"
            >
              <div className="flex flex-col gap-1.5 pb-1">
                <label
                  htmlFor="auth-password"
                  className="font-medium text-foreground text-sm"
                >
                  Password
                </label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "signup"
                      ? "Create a strong password"
                      : "Your password"
                  }
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  required
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "auth-error" : undefined}
                  className="h-10"
                />
                {mode === "signup" && password.length > 0 && (
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
                            className={cn(
                              "size-3 shrink-0",
                              !ok && "opacity-30"
                            )}
                            aria-hidden
                          />
                          {rule.label}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p
            id="auth-error"
            role="alert"
            translate="no"
            className="text-destructive text-sm"
          >
            {error}
            {conflict && (
              <>
                {" "}
                <Link
                  href={`/login${nextQS}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in instead
                </Link>
              </>
            )}
            {restorable && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => void onRestore()}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Restore it
                </button>
              </>
            )}
          </p>
        )}

        <Button
          type="submit"
          translate="no"
          className="h-10 w-full"
          disabled={pending || !canSubmit}
        >
          {pending ? c.pending : c.cta}
          {!pending && <ArrowRight className="size-4" data-icon="inline-end" />}
        </Button>
      </form>

      <p className="text-center text-muted-foreground text-sm">
        {c.alt}{" "}
        <Link
          href={`${c.altHref}${nextQS}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {c.altLink}
        </Link>
      </p>
    </motion.div>
  )
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}
