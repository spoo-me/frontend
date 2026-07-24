// Sentry init for the Node.js server runtime. Imported by
// instrumentation.ts' register() when NEXT_RUNTIME === "nodejs".
import * as Sentry from "@sentry/nextjs"

import {
  SENTRY_ENVIRONMENT,
  SENTRY_RELEASE,
  SENTRY_SEND_PII,
  SENTRY_TRACES_SAMPLE_RATE,
  SERVER_SENTRY_DSN,
} from "@/lib/sentry-shared"

// No DSN → no init. Sentry APIs (captureException, onRequestError) become
// harmless no-ops, so the app runs with no Sentry env configured.
if (SERVER_SENTRY_DSN) {
  Sentry.init({
    dsn: SERVER_SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: SENTRY_SEND_PII,
    // Errors are always captured; only traces are sampled.
    enableLogs: false,
  })
}
