// Sentry init for the edge runtime (middleware, edge routes). Imported by
// instrumentation.ts' register() when NEXT_RUNTIME === "edge".
import * as Sentry from "@sentry/nextjs"

import {
  SENTRY_ENVIRONMENT,
  SENTRY_RELEASE,
  SENTRY_SEND_PII,
  SENTRY_TRACES_SAMPLE_RATE,
  SERVER_SENTRY_DSN,
} from "@/lib/sentry-shared"

// No DSN → no init, same graceful no-op as the server runtime.
if (SERVER_SENTRY_DSN) {
  Sentry.init({
    dsn: SERVER_SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: SENTRY_SEND_PII,
    enableLogs: false,
  })
}
