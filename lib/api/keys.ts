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

/** Wire shape of /api/v1/keys (backend ApiKeyResponse): the list envelope
    key is `keys`, timestamps are Unix SECONDS, and last_used_at is null
    until the key first authenticates a request (the server debounces
    updates to at most once an hour). Normalized here so the rest of the
    app keeps ISO strings. */
type ApiKeyWire = {
  id: string
  name: string
  description?: string | null
  scopes?: string[]
  created_at?: number | null
  expires_at?: number | null
  revoked: boolean
  token_prefix?: string | null
  last_used_at?: number | null
}

const isoOf = (unixSeconds: number | null | undefined) =>
  unixSeconds == null ? null : new Date(unixSeconds * 1000).toISOString()

function normalizeKey(w: ApiKeyWire): ApiKey {
  return {
    id: w.id,
    name: w.name,
    description: w.description ?? null,
    token_prefix: w.token_prefix ?? "",
    scopes: w.scopes ?? [],
    created_at: isoOf(w.created_at) ?? "",
    expires_at: isoOf(w.expires_at),
    last_used_at: isoOf(w.last_used_at),
    revoked: w.revoked,
  }
}

/** Scopes accepted by POST /api/v1/keys (mirrors the backend registry). */
export const API_KEY_SCOPES = [
  "shorten:create",
  "urls:read",
  "urls:manage",
  "stats:read",
  "domains:read",
  "domains:manage",
  "reports:create",
] as const

export function createApiKey(input: {
  name: string
  description?: string
  scopes: string[]
  expires_at?: string
}) {
  return authedFetch("/api/v1/keys", jsonInit("POST", input)).then(
    async (r): Promise<ApiKeyCreated> => {
      const wire = await parse<ApiKeyWire & { token: string }>(r)
      return { ...normalizeKey(wire), token: wire.token }
    }
  )
}

export function listApiKeys() {
  return authedFetch("/api/v1/keys", { method: "GET" }).then(
    async (r): Promise<{ items: ApiKey[] }> => {
      const wire = await parse<{ keys: ApiKeyWire[] }>(r)
      return { items: (wire.keys ?? []).map(normalizeKey) }
    }
  )
}

/** revoke=true soft-revokes (key stays listed, unusable); false hard-deletes. */
export async function deleteApiKey(id: string, revoke = false) {
  const res = await authedFetch(
    `/api/v1/keys/${encodeURIComponent(id)}?revoke=${revoke}`,
    { method: "DELETE" }
  )
  if (!res.ok) await parse(res)
}
