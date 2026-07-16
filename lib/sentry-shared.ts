/**
 * Shared Sentry init options for the server and edge runtimes.
 *
 * The browser client reads its own public DSN from lib/flags.ts and inits
 * in instrumentation-client.ts. This module is server-only: it reads the
 * runtime SENTRY_DSN (a plain, non-public env var, so it can differ from
 * the browser DSN and point at a project that keeps request PII).
 *
 * Every value degrades cleanly. With SENTRY_DSN unset the init is skipped
 * entirely, so the app builds and runs with no Sentry env at all.
 */

/** Runtime server/edge DSN. Undefined means "do not init" (no-op). */
export const SERVER_SENTRY_DSN = process.env.SENTRY_DSN

/**
 * Deployment environment tag. Mirrors the backend's ENV convention
 * (production / beta / development) so both runtimes group under the same
 * environment in Sentry. Falls back to NODE_ENV when unset.
 */
export const SENTRY_ENVIRONMENT =
  process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development"

/**
 * Release tag. CI injects APP_VERSION (release version or short sha); the
 * literal "dev" default is treated as no release, matching the backend.
 */
export const SENTRY_RELEASE =
  process.env.APP_VERSION && process.env.APP_VERSION !== "dev"
    ? process.env.APP_VERSION
    : undefined

/**
 * Performance trace sample rate. Modest default (0.1) matching the
 * backend's sentry_traces_sample_rate; override with the same-named env.
 */
export const SENTRY_TRACES_SAMPLE_RATE = (() => {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE
  const parsed = raw ? Number(raw) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0.1
})()

/**
 * Whether to attach request PII (IP, headers) on the server. Off by
 * default to match the backend's sentry_send_pii default; the server DSN
 * split exists so this can be flipped on server-side without affecting
 * the browser client, which never sends PII.
 */
export const SENTRY_SEND_PII = process.env.SENTRY_SEND_PII === "true"
