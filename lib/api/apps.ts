import { authedFetch, parse, SpooApiError } from "./client"

/**
 * Connected apps = device-auth grants (CLI, extensions, bots).
 * GET /api/v1/apps lists the account's active grants (JWT-cookie only,
 * newest first); POST /auth/device/revoke disconnects one, keyed by `app`.
 *
 * Grants are NOT scoped — a device grant acts as the full account — so the
 * wire carries the consent-screen permission strings, never scope slugs.
 */
export type AppGrant = {
  /** Grant document id. Row identity only; revoke keys on `app`. */
  id: string
  /** Backend registry key. Shares a namespace with lib/apps-data.ts slugs
   *  (exact-match catalogue join) and is the revoke handle. */
  app: string
  /** Server-owned display name; falls back to `app` when the registry
   *  entry is gone. */
  app_name: string
  /** Registry icon filename, or null when the entry is gone. The UI
   *  prefers the catalogue brand tile via the `app` join. */
  icon: string | null
  /** Consent-screen permission strings the user granted. May be empty. */
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

/** `app` is the grant's registry key (AppGrant.app), not the grant id. */
export function revokeAppGrant(app: string) {
  return authedFetch("/auth/device/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // CSRF guard: the backend rejects cross-origin form posts by
      // requiring this header, which forms cannot send.
      "X-Requested-With": "XMLHttpRequest",
    },
    body: new URLSearchParams({ app_id: app }).toString(),
  }).then((r) => parse<{ success: boolean; message: string }>(r))
}
