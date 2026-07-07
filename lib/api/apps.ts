import { authedFetch, jsonInit, parse } from "./client"

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
  scopes: string[]
  granted_at: string
  last_used_at: string
  device: string
}

export function listAppGrants() {
  return authedFetch("/api/v1/apps", { method: "GET" }).then((r) =>
    parse<{ items: AppGrant[] }>(r),
  )
}

export function revokeAppGrant(grantId: string) {
  return authedFetch(
    "/auth/device/revoke",
    jsonInit("POST", { grant_id: grantId }),
  ).then((r) => parse<{ success: boolean }>(r))
}
