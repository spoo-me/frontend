import * as Sentry from "@sentry/nextjs"

import { initAnalytics } from "@/lib/analytics"
import { SENTRY_BROWSER_DSN } from "@/lib/flags"

// Browser Sentry init. No-op unless NEXT_PUBLIC_SENTRY_DSN is set (mock
// mode, CI, self-hosters) — mirrors how analytics no-ops without a key.
// Distinct DSN from the server: the client never sends PII (IP stripped),
// only traces are sampled, errors are always captured.
if (SENTRY_BROWSER_DSN) {
  Sentry.init({
    dsn: SENTRY_BROWSER_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
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
