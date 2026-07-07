import { authedFetch, jsonInit, parse } from "./client"

export type ApiKey = {
  id: string
  name: string
  description: string | null
  token_prefix: string
  scopes: string[]
  created_at: string
  expires_at: string | null
  last_used_at: string | null
  revoked: boolean
}

export type ApiKeyCreated = ApiKey & {
  /** Full token — only returned once, at creation. */
  token: string
}

/** Scopes accepted by POST /api/v1/keys (mirrors the backend registry). */
export const API_KEY_SCOPES = [
  "shorten:create",
  "urls:read",
  "urls:manage",
  "stats:read",
  "domains:read",
  "domains:manage",
] as const

export function createApiKey(input: {
  name: string
  description?: string
  scopes: string[]
  expires_at?: string
}) {
  return authedFetch("/api/v1/keys", jsonInit("POST", input)).then((r) =>
    parse<ApiKeyCreated>(r),
  )
}

export function listApiKeys() {
  return authedFetch("/api/v1/keys", { method: "GET" }).then((r) =>
    parse<{ items: ApiKey[] }>(r),
  )
}

/** revoke=true soft-revokes (key stays listed, unusable); false hard-deletes. */
export async function deleteApiKey(id: string, revoke = false) {
  const res = await authedFetch(
    `/api/v1/keys/${encodeURIComponent(id)}?revoke=${revoke}`,
    { method: "DELETE" },
  )
  if (!res.ok) await parse(res)
}
