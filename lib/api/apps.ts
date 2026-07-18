import { authedFetch, jsonInit, parse, SpooApiError } from "./client"

/**
 * Connected apps = device-auth grants (CLI, extensions, bots). The real
 * backend exposes revoke via POST /auth/device/revoke; the JSON list is the
 * dashboard-era endpoint (mocked today, flagged in API-SURFACE.md).
 */
export type AppGrant = {
  id: string
  app: string
  app_name: string
  icon: string
  /** Effective scope slugs. Empty means a legacy unrestricted grant. */
  scopes: string[]
  /** Human-readable consent sentences derived from `scopes`. */
  permissions: string[]
  granted_at: string
  last_used_at: string | null
}

export function listAppGrants() {
  return authedFetch("/api/v1/apps", { method: "GET" })
    .then(
      (r) => parse<{ items: AppGrant[] }>(r)
      // The list endpoint doesn't exist on the real backend yet (device
      // grants are revoke-only there); treat its absence as an empty list
      // instead of poisoning every query that gates on this answering.
    )
    .catch((e: unknown) => {
      if (e instanceof SpooApiError && (e.status === 404 || e.status === 405))
        return { items: [] }
      throw e
    })
}

export function revokeAppGrant(grantId: string) {
  const init = jsonInit("POST", { grant_id: grantId })
  // Device revoke is CSRF-guarded by an X-Requested-With header the backend
  // requires and cross-origin form posts can't set. jsonInit only sets
  // Content-Type, so add it here.
  init.headers = { ...init.headers, "X-Requested-With": "fetch" }
  return authedFetch("/auth/device/revoke", init).then((r) =>
    parse<{ success: boolean }>(r)
  )
}
