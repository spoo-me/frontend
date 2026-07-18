import { authedFetch, jsonInit, parse, SpooApiError } from "./client"

/**
 * Connected apps = device-auth grants (CLI, extensions, bots).
 * GET /api/v1/apps lists the account's active grants (JWT-cookie only,
 * newest first); POST /auth/device/revoke disconnects one, keyed by `id`.
 *
 * Grants carry the effective scope slugs plus their derived consent
 * sentences; legacy grants (pre-scopes) surface an empty scope list and
 * the full-access sentence.
 */
export type AppGrant = {
  /** Grant document id — the revoke handle (`grant_id`). */
  id: string
  /** Backend registry key. Shares a namespace with lib/apps-data.ts slugs
   *  (exact-match catalogue join). */
  app: string
  /** Server-owned display name; falls back to `app` when the registry
   *  entry is gone. */
  app_name: string
  /** Registry icon filename, or null when the entry is gone. The UI
   *  prefers the catalogue brand tile via the `app` join. */
  icon: string | null
  /** Effective scope slugs — the render source for scope chips. Empty
   *  means a legacy unrestricted grant: full account access, not zero. */
  scopes: string[]
  /** Consent sentences the server derives from `scopes` (full-access
   *  sentence for legacy grants). Display-ready fallback copy. */
  permissions: string[]
  /** ISO 8601 UTC (+00:00). */
  granted_at: string
  /** ISO 8601 UTC, null when the app never exchanged/refreshed a token. */
  last_used_at: string | null
}

export function listAppGrants() {
  return authedFetch("/api/v1/apps", { method: "GET" })
    .then((r) => parse<{ items: AppGrant[] }>(r))
    .catch((e: unknown) => {
      // Backends without the list endpoint (production until the next
      // backend release, older self-hosted deploys) 404 here. On those
      // backends the endpoint's absence and "no connected apps" are
      // indistinguishable, so degrade to an empty list instead of
      // poisoning every query that gates on this answering. Anything
      // else — 5xx, auth failures — still throws and surfaces as a real
      // error state.
      if (e instanceof SpooApiError && (e.status === 404 || e.status === 405))
        return { items: [] }
      throw e
    })
}

/** `grantId` is the grant document id (AppGrant.id). */
export function revokeAppGrant(grantId: string) {
  const init = jsonInit("POST", { grant_id: grantId })
  return authedFetch("/auth/device/revoke", {
    ...init,
    headers: {
      ...init.headers,
      // CSRF guard: the backend rejects revokes without this exact
      // header value, which cross-origin form posts cannot send.
      "X-Requested-With": "fetch",
    },
  }).then((r) => parse<{ success: boolean; message: string }>(r))
}
