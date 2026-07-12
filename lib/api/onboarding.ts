import { authedFetch, jsonInit, parse } from "./client"

/** Resume pointer, nothing more. Empty (step=null) = nothing to resume:
    never started, expired, or already completed — completion is the
    permanent `user.onboarded_at` on /auth/me, not part of this cache. */
export type OnboardingServerState = {
  step: string | null
  path: "links" | "api" | null
}

/** Read the stored wizard pointer. */
export function getOnboardingState() {
  return authedFetch("/auth/onboarding", { method: "GET" }).then((r) =>
    parse<OnboardingServerState>(r)
  )
}

/** Persist wizard progress server-side (refreshes the 24h TTL). */
export function putOnboardingState(input: {
  step: string
  path?: "links" | "api" | null
}) {
  return authedFetch("/auth/onboarding", jsonInit("PUT", input)).then((r) =>
    parse<OnboardingServerState>(r)
  )
}

/** Mark onboarding finished: stamps user.onboarded_at (first completion
    wins), records HDYHAU, and drops the resume pointer. */
export function completeOnboarding(heardFrom?: string) {
  return authedFetch(
    "/auth/onboarding/complete",
    jsonInit("POST", heardFrom ? { heard_from: heardFrom } : {})
  ).then((r) => parse<{ success: boolean; onboarded_at: string }>(r))
}
