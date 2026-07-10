/**
 * Onboarding flow model — route-per-step (Dub-style).
 *
 * The URL is the source of truth for "where am I"; the server cache
 * (/auth/onboarding, Redis, 24h TTL) makes resume work across devices and
 * gates re-entry; localStorage carries only the bits the server doesn't:
 * the first-artifact recap and the HDYHAU answer.
 */

export type OnboardingPath = "links" | "api"

export type OnboardingStep =
  | "welcome"
  | "path"
  | "link"
  | "api"
  | "domain"
  | "apps"
  | "done"

export const STEP_ROUTES: Record<OnboardingStep, string> = {
  welcome: "/onboarding/welcome",
  path: "/onboarding/path",
  link: "/onboarding/link",
  api: "/onboarding/api",
  domain: "/onboarding/domain",
  apps: "/onboarding/apps",
  done: "/onboarding/done",
}

export function isOnboardingStep(v: unknown): v is OnboardingStep {
  return typeof v === "string" && v in STEP_ROUTES
}

/** Inverse of STEP_ROUTES — which step a pathname renders, if any. */
export function stepFromRoute(pathname: string): OnboardingStep | null {
  const hit = (Object.keys(STEP_ROUTES) as OnboardingStep[]).find(
    (step) => STEP_ROUTES[step] === pathname,
  )
  return hit ?? null
}

/** Client-side stash — artifact recap + attribution, same-device only. */
export type OnboardingStash = {
  artifact?:
    | { kind: "link"; shortUrl: string; alias: string }
    | { kind: "key"; name: string; tokenPrefix: string }
  heardFrom?: string
}

const STORAGE_KEY = "spoo.onboarding.v3"

export function loadStash(): OnboardingStash {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

export function saveStash(patch: Partial<OnboardingStash>) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...loadStash(), ...patch }),
    )
  } catch {
    // Storage unavailable (private mode etc.) — the recap degrades, the
    // flow itself is unaffected.
  }
}

/**
 * Sentinel sitting inside the onboarding curl template, highlighted once on
 * the server (vesper) then swapped for the real token client-side. It lives
 * inside a quoted string so Shiki keeps it as one contiguous token.
 */
export const CURL_TOKEN_PLACEHOLDER = "SPOO_TOKEN_PLACEHOLDER"

export const HEARD_FROM_OPTIONS = [
  "X / Twitter",
  "GitHub",
  "Discord",
  "Search",
  "Friend or colleague",
  "Other",
] as const
