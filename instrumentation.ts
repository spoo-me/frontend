import * as Sentry from "@sentry/nextjs"

// Server/edge Sentry init. The per-runtime config files each guard on
// SENTRY_DSN, so importing them is a no-op when Sentry is unconfigured.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
    // The browser proxy target is compiled in at build time; a different
    // runtime value would split server fetches from browser calls.
    const built = process.env.SPOO_BUILT_API_URL
    const runtime = process.env.SPOO_API_URL
    if (built && runtime && built !== runtime)
      console.warn(
        `SPOO_API_URL=${runtime} at runtime, but the proxy was compiled for ${built}. Rebuild with --build-arg SPOO_API_URL to change the proxy target.`
      )
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

// Captures errors thrown in Server Components, route handlers and
// middleware. No-op until the server runtime has been init'd with a DSN.
export const onRequestError = Sentry.captureRequestError
