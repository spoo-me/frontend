import { authedFetch, jsonInit, parse } from "./client"

export type OnboardingServerState = {
  step: string | null
  path: "links" | "api" | null
  completed: boolean
}

/** Read stored wizard progress. Empty state = never started or 24h TTL lapsed. */
export function getOnboardingState() {
  return authedFetch("/auth/onboarding", { method: "GET" }).then((r) =>
    parse<OnboardingServerState>(r),
  )
}

/** Persist wizard progress server-side (refreshes the 24h TTL). */
export function putOnboardingState(input: {
  step: string
  path?: "links" | "api" | null
}) {
  return authedFetch("/auth/onboarding", jsonInit("PUT", input)).then((r) =>
    parse<OnboardingServerState>(r),
  )
}
