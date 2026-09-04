/**
 * The return flow after checkout, as pure decisions so the page stays a
 * thin poller. The version the user left with is stashed before the
 * redirect to the payment page; the return page polls until the server's
 * version moves past it.
 */
const STASH_KEY = "spoo:upgrade:version"

export const POLL_INTERVAL_MS = 2000
export const PATIENCE_MS = 60_000

export function stashVersion(version: number | undefined): void {
  try {
    if (version === undefined) window.sessionStorage.removeItem(STASH_KEY)
    else window.sessionStorage.setItem(STASH_KEY, String(version))
  } catch {
    // No storage: the return page then treats the first answer as baseline.
  }
}

export function readStashedVersion(): number | null {
  try {
    const raw = window.sessionStorage.getItem(STASH_KEY)
    if (raw === null) return null
    const n = Number(raw)
    return Number.isInteger(n) ? n : null
  } catch {
    return null
  }
}

export function clearStashedVersion(): void {
  try {
    window.sessionStorage.removeItem(STASH_KEY)
  } catch {
    // ignore
  }
}

/** True once the server's version has moved past the one we left with. */
export function paymentLanded(
  baseline: number | null,
  current: number | undefined
): boolean {
  if (current === undefined) return false
  if (baseline === null) return false
  return current > baseline
}

/** A version bump alone is not a payment: reminders and overrides bump it
    too. Only a Pro plan in a paid status counts. */
export function planIsPaid(
  plan: { name: string; status: string | null } | undefined
): boolean {
  return (
    plan?.name === "pro" &&
    (plan.status === "active" || plan.status === "cancel_at_period_end")
  )
}

const ORIGIN = "https://spoo.me"

/** Only dashboard paths on our own origin are ever redirected to. */
export function safeReturnPath(raw: string | null): string {
  if (!raw) return "/dashboard"
  let u: URL
  try {
    u = new URL(raw, ORIGIN)
  } catch {
    return "/dashboard"
  }
  return u.origin === ORIGIN && u.pathname.startsWith("/dashboard")
    ? `${u.pathname}${u.search}${u.hash}`
    : "/dashboard"
}
