import * as Sentry from "@sentry/nextjs"

import { initAnalytics } from "@/lib/analytics"
import { CLARITY_ID, SENTRY_BROWSER_DSN } from "@/lib/flags"
import { SENTRY_APPLICATION_KEY } from "./sentry.application-key.mjs"

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
    // Browser extensions, in-app WebView bridges and Cloudflare's analytics
    // beacon all throw inside our pages, and the SDK rewrites their origin
    // to app:/// so they arrive looking like our own frames. The build
    // stamps every module in our bundle with the application key; an error
    // whose frames carry none of it came from a script we do not ship.
    // "exclusively" spares anything with even one of our frames, so a real
    // error that merely runs through third-party code still reports.
    //
    // Tag first, drop later. Dropping fails silently: a mis-wired key makes
    // every frame look foreign and takes all browser errors with it, and
    // nothing alerts on an absence of events. So tag third_party_code, and
    // once it is confirmed to land on the WebView, extension and beacon
    // issues and on nothing of ours, swap this one string for
    // "drop-error-if-exclusively-contains-third-party-frames".
    //
    // Tagging also sidesteps an edge in the integration: an event whose
    // frames are all discarded for lacking a filename or a position leaves
    // an empty key list, and [].every() is vacuously true, so drop mode
    // treats "we learned nothing" as "third-party". Only zero frames bail.
    integrations: [
      Sentry.thirdPartyErrorFilterIntegration({
        filterKeys: [SENTRY_APPLICATION_KEY],
        behaviour: "apply-tag-if-exclusively-contains-third-party-frames",
      }),
    ],
    // Strip IPs and request bodies from browser events (see the server
    // DSN split): product analytics is PostHog's job, not Sentry's.
    sendDefaultPii: false,
    enableLogs: false,
  })
}

// PostHog product analytics — runs once before hydration, no-op without a
// key. Untouched by the Sentry wiring above.
initAnalytics()

// Microsoft Clarity — production host only: beta and self-hosted deploys
// share this image and must not pollute the baseline. Content masking is
// governed by the Clarity project's masking mode, not here.
if (CLARITY_ID && browserEnvironment() === "production") {
  type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] }
  const w = window as Window & { clarity?: ClarityFn }
  if (!w.clarity) {
    const queued: ClarityFn = (...args) => {
      queued.q = queued.q ?? []
      queued.q.push(args)
    }
    w.clarity = queued
    const tag = document.createElement("script")
    tag.async = true
    tag.src = `https://www.clarity.ms/tag/${CLARITY_ID}`
    document.head.appendChild(tag)
  }
}

// Instruments client-side router navigations for performance traces.
// A no-op until Sentry.init has run with a DSN.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
