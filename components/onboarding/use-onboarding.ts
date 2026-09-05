"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  trackOnboardingCompleted,
  trackOnboardingStepCompleted,
} from "@/lib/analytics"
import {
  loadStash,
  STEP_ROUTES,
  stepFromRoute,
  type OnboardingPath,
  type OnboardingStep,
} from "@/lib/onboarding"
import { completeOnboarding, putOnboardingState } from "@/lib/api"
import { takeSignupPlan } from "@/lib/signup-plan"
import { useAuth } from "@/components/auth/auth-context"

/**
 * Step navigation for the route-per-step flow: pushes the next route and
 * mirrors progress to the server cache (fire-and-forget — the cache is
 * best-effort by design; the URL is the local source of truth).
 *
 * Being the single choke point every step routes through, this is also
 * where the onboarding funnel is instrumented: advancing away from a step
 * marks it completed (the CURRENT route, not the target).
 */
export function useOnboarding() {
  const router = useRouter()
  const pathname = usePathname()
  const { refresh } = useAuth()

  const advance = React.useCallback(
    (step: OnboardingStep, path?: OnboardingPath | null) => {
      const completed = stepFromRoute(pathname)
      if (completed) trackOnboardingStepCompleted(completed, path ?? undefined)
      putOnboardingState({
        step,
        ...(path !== undefined ? { path } : {}),
      }).catch(() => {})
      router.push(STEP_ROUTES[step])
    },
    [router, pathname]
  )

  const complete = React.useCallback(async (): Promise<boolean> => {
    // The stash already carries what the flow produced (done page saves
    // heardFrom right before calling this) — the HDYHAU answer finally
    // leaves localStorage.
    const stash = loadStash()
    // A swallowed failure here would leave onboarded_at null and the
    // dashboard gate would bounce straight back into the wizard — a
    // silent loop. Report it so the recap can offer a retry.
    try {
      await completeOnboarding(stash.heardFrom)
    } catch {
      return false
    }
    trackOnboardingCompleted({
      heardFrom: stash.heardFrom,
      artifactKind: stash.artifact?.kind ?? null,
    })
    // The session must learn onboarded_at BEFORE the dashboard renders.
    await refresh().catch(() => {})
    router.push(
      takeSignupPlan() === "pro"
        ? "/upgrade?from=plan&return=/dashboard"
        : "/dashboard"
    )
    return true
  }, [router, refresh])

  return { advance, complete }
}
