"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/logo"
import { useAuth } from "@/components/auth/auth-context"
import {
  INITIAL_STATE,
  loadOnboarding,
  saveOnboarding,
  type OnboardingPath,
  type OnboardingState,
  type OnboardingStep,
} from "@/lib/onboarding"
import type { ApiKeyCreated, ShortUrl } from "@/lib/api"
import { VerifyStep } from "./steps/verify-step"
import { ThemeStep } from "./steps/theme-step"
import { PathStep } from "./steps/path-step"
import { LinkStep } from "./steps/link-step"
import { ApiStep } from "./steps/api-step"
import { DoneStep } from "./steps/done-step"

export function OnboardingWizard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [state, setState] = React.useState<OnboardingState | null>(null)

  // Hydrate from storage once the session settles. The step list is fixed
  // at entry: verified accounts (OAuth, returners) never see the OTP step.
  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login?next=/onboarding")
      return
    }
    const stored = loadOnboarding()
    if (stored.completed) {
      router.replace("/dashboard")
      return
    }
    if (stored.step === "verify" && user.email_verified) {
      // Verified accounts (OAuth, or verified in another tab) skip the OTP
      // step entirely — and the step list stays fixed for the whole run.
      stored.step = "theme"
      stored.sawVerify = false
    }
    if (stored.step === "artifact" && !stored.path) {
      stored.step = "path" // storage drift — never strand the user
    }
    setState({ ...INITIAL_STATE, ...stored })
  }, [loading, user, router])

  const update = React.useCallback((patch: Partial<OnboardingState>) => {
    setState((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      saveOnboarding(next)
      return next
    })
  }, [])

  const steps = React.useMemo<OnboardingStep[]>(
    () => [
      ...(state?.sawVerify !== false ? (["verify"] as const) : []),
      "theme",
      "path",
      "artifact",
      "done",
    ],
    [state?.sawVerify],
  )

  if (!state || !user) {
    return (
      <div className="bg-background flex min-h-dvh items-center justify-center">
        <span className="label-mono text-muted-foreground/60 animate-pulse text-[10px]">
          loading…
        </span>
      </div>
    )
  }

  const stepIndex = Math.max(steps.indexOf(state.step), 0)

  function finish(heardFrom?: string) {
    update({ completed: true, ...(heardFrom ? { heardFrom } : {}) })
    router.push("/dashboard")
  }

  return (
    <div className="bg-background relative flex min-h-dvh flex-col overflow-hidden">
      {/* Faint brand presence, same register as the auth pages */}
      <div
        aria-hidden
        className="bg-brand/[0.07] pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
      />

      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="label-mono text-muted-foreground/70 text-[10px] tabular-nums">
            {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-0.5 w-5 rounded-full transition-colors duration-300",
                  i <= stepIndex ? "bg-brand" : "bg-border",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 24, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(3px)" }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex w-full max-w-2xl justify-center"
          >
            {state.step === "verify" && (
              <VerifyStep onDone={() => update({ step: "theme" })} />
            )}
            {state.step === "theme" && (
              <ThemeStep onDone={() => update({ step: "path" })} />
            )}
            {state.step === "path" && (
              <PathStep
                onDone={(path: OnboardingPath) => update({ path, step: "artifact" })}
              />
            )}
            {state.step === "artifact" &&
              (state.path === "api" ? (
                <ApiStep
                  onDone={(key: ApiKeyCreated) =>
                    update({
                      step: "done",
                      artifact: {
                        kind: "key",
                        name: key.name,
                        tokenPrefix: key.token_prefix ?? key.token.slice(0, 9),
                      },
                    })
                  }
                  onSkip={() => update({ step: "done" })}
                />
              ) : (
                <LinkStep
                  onDone={(link: ShortUrl) =>
                    update({
                      step: "done",
                      artifact: {
                        kind: "link",
                        shortUrl: link.short_url,
                        alias: link.alias,
                      },
                    })
                  }
                  onSkip={() => update({ step: "done" })}
                />
              ))}
            {state.step === "done" && <DoneStep state={state} onFinish={finish} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

