import * as Sentry from "@sentry/nextjs"

import { initAnalytics } from "@/lib/analytics"
import { SENTRY_BROWSER_DSN } from "@/lib/flags"

// Deployment environment, resolved from the host at runtime. Build-time
// NODE_ENV can't tell beta from prod — they run the SAME image — so a
// build-baked tag would file every beta browser event under production.
// The hostname is the one signal available client-side. Mirrors the
// server's production / beta / development convention (sentry-shared.ts).
function browserEnvironment(): string {
  if (typeof window === "undefined") return "development"
  const host = window.location.hostname
  if (host === "beta.spoo.me") return "beta"
  if (host === "spoo.me" || host === "www.spoo.me") return "production"
  return "development"
}

// Browser Sentry init. No-op unless NEXT_PUBLIC_SENTRY_DSN is set (mock
// mode, CI, self-hosters) — mirrors how analytics no-ops without a key.
// Distinct DSN from the server: the client never sends PII (IP stripped),
// only traces are sampled, errors are always captured.
if (SENTRY_BROWSER_DSN) {
  const environment = browserEnvironment()
  Sentry.init({
    dsn: SENTRY_BROWSER_DSN,
    environment,
    tracesSampleRate: environment === "development" ? 1.0 : 0.1,
    // Strip IPs and request bodies from browser events (see the server
    // DSN split): product analytics is PostHog's job, not Sentry's.
    sendDefaultPii: false,
    enableLogs: false,
  })
}

// PostHog product analytics — runs once before hydration, no-op without a
// key. Untouched by the Sentry wiring above.
initAnalytics()

// Instruments client-side router navigations for performance traces.
// A no-op until Sentry.init has run with a DSN.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
