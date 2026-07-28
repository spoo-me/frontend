import * as Sentry from "@sentry/nextjs"

// Server/edge Sentry init. The per-runtime config files each guard on
// SENTRY_DSN, so importing them is a no-op when Sentry is unconfigured.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

// Captures errors thrown in Server Components, route handlers and
// middleware. No-op until the server runtime has been init'd with a DSN.
export const onRequestError = Sentry.captureRequestError
