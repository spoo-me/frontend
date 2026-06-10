"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  STEP_ROUTES,
  type OnboardingPath,
  type OnboardingStep,
} from "@/lib/onboarding"
import { putOnboardingState } from "@/lib/api"

/**
 * Step navigation for the route-per-step flow: pushes the next route and
 * mirrors progress to the server cache (fire-and-forget — the cache is
 * best-effort by design; the URL is the local source of truth).
 */
export function useOnboarding() {
  const router = useRouter()

  const advance = React.useCallback(
    (step: OnboardingStep, path?: OnboardingPath | null) => {
      putOnboardingState({ step, ...(path !== undefined ? { path } : {}) }).catch(
        () => {},
      )
      router.push(STEP_ROUTES[step])
    },
    [router],
  )

  const complete = React.useCallback(() => {
    putOnboardingState({ step: "completed" }).catch(() => {})
    router.push("/dashboard")
  }, [router])

  return { advance, complete }
}
