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
import { putOnboardingState } from "@/lib/api"

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

  const advance = React.useCallback(
    (step: OnboardingStep, path?: OnboardingPath | null) => {
      const completed = stepFromRoute(pathname)
      if (completed) trackOnboardingStepCompleted(completed, path ?? undefined)
      putOnboardingState({ step, ...(path !== undefined ? { path } : {}) }).catch(
        () => {},
      )
      router.push(STEP_ROUTES[step])
    },
    [router, pathname],
  )

  const complete = React.useCallback(() => {
    // The stash already carries what the flow produced (done page saves
    // heardFrom right before calling this) — the HDYHAU answer finally
    // leaves localStorage.
    const stash = loadStash()
    trackOnboardingCompleted({
      heardFrom: stash.heardFrom,
      artifactKind: stash.artifact?.kind ?? null,
    })
    putOnboardingState({ step: "completed" }).catch(() => {})
    router.push("/dashboard")
  }, [router])

  return { advance, complete }
}
