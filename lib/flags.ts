/**
 * Build-time switches — the single registry of every NEXT_PUBLIC_* toggle.
 *
 * Rule: no other module reads process.env.NEXT_PUBLIC_* directly. Declare
 * the switch here with what it hides and when it dies, so one grep of this
 * file lists every dark surface in the frontend.
 *
 * These are inlined at build time by Next.js — flipping one is a redeploy,
 * not a runtime change. Per-user gating is a different tool entirely:
 * that's the backend flag service via /me/features and <Velvet>.
 */

/**
 * PostHog project key. Analytics is a no-op without it (mock mode, CI,
 * self-hosters). Set in the deploy environment; never in a committed file.
 */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

/**
 * The public pricing surface: the /pricing route plus every reference to
 * it (header, footer, command palette) and the account "Plan" row. Dark
 * until real plans are drafted; delete the switch once billing is
 * generally available and the page is permanent.
 */
export const PRICING_ENABLED = process.env.NEXT_PUBLIC_PRICING === "1"

/**
 * hCaptcha sitekey for the public intake forms (/contact, /report).
 * Mirrors the backend's configured/unconfigured semantics: unset (mock
 * mode, self-hosters without hcaptcha_* settings) means the captcha step
 * is skipped entirely and the forms submit without a token.
 */
export const HCAPTCHA_SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY

/**
 * Browser-side Sentry DSN. Distinct from the server DSN (SENTRY_DSN, a
 * runtime env read only in the server/edge init) so the two runtimes send
 * to separate projects with independent PII posture: the browser client
 * strips IPs, the server keeps request context. Error and performance
 * monitoring is a no-op without it (mock mode, CI, self-hosters). Set in
 * the deploy environment; never in a committed file.
 */
export const SENTRY_BROWSER_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
