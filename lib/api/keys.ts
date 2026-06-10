import { authedFetch, jsonInit, parse } from "./client"

export type ApiKeyCreated = {
  id: string
  name: string
  scopes: string[]
  token_prefix: string | null
  /** Full token — only returned once, at creation. */
  token: string
}

/** Scopes accepted by POST /api/v1/keys (mirrors the backend registry). */
export const API_KEY_SCOPES = [
  "shorten:create",
  "urls:read",
  "urls:manage",
  "stats:read",
] as const

export function createApiKey(input: {
  name: string
  description?: string
  scopes: string[]
}) {
  return authedFetch("/api/v1/keys", jsonInit("POST", input)).then((r) =>
    parse<ApiKeyCreated>(r),
  )
}
