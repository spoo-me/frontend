/**
 * Onboarding wizard state — persisted to localStorage so the flow is
 * resumable and never traps the user (Dub's self-expiring-gate idea,
 * minus the backend: the user model has no onboarding field yet).
 */

export type OnboardingPath = "links" | "api"

export type OnboardingStep =
  | "verify"
  | "theme"
  | "path"
  | "artifact"
  | "done"

export type OnboardingState = {
  step: OnboardingStep
  path: OnboardingPath | null
  /** Whether the verify step is part of this run (fixed at first entry). */
  sawVerify: boolean
  /** First artifact produced during the flow, shown on the done screen. */
  artifact?:
    | { kind: "link"; shortUrl: string; alias: string }
    | { kind: "key"; name: string; tokenPrefix: string }
  completed: boolean
  /** Stashed client-side until an attribution endpoint exists. */
  heardFrom?: string
}

const STORAGE_KEY = "spoo.onboarding.v1"

export const INITIAL_STATE: OnboardingState = {
  step: "verify",
  path: null,
  sawVerify: true,
  completed: false,
}

export function loadOnboarding(): OnboardingState {
  if (typeof window === "undefined") return INITIAL_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_STATE
    return { ...INITIAL_STATE, ...(JSON.parse(raw) as OnboardingState) }
  } catch {
    return INITIAL_STATE
  }
}

export function saveOnboarding(state: OnboardingState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable (private mode etc.) — flow still works, just
    // won't resume across reloads.
  }
}

export const HEARD_FROM_OPTIONS = [
  "X / Twitter",
  "GitHub",
  "Discord",
  "Search",
  "Friend or colleague",
  "Other",
] as const
