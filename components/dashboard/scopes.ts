import { API_KEY_SCOPES } from "@/lib/api"

/**
 * What each scope grants, in plain words — the ONE source for the developer
 * page's create-key checklist and every scope chip tooltip (keys and app
 * grants alike).
 */
export const SCOPE_INFO: Record<
  (typeof API_KEY_SCOPES)[number] | "keys:manage" | "admin:all",
  string
> = {
  "shorten:create": "Create short links",
  "urls:read": "List and read links",
  "urls:manage": "Edit and delete links",
  "stats:read": "Read analytics data",
  "domains:read": "List custom domains",
  "domains:manage": "Add and remove domains",
  "reports:create": "Submit abuse reports",
  // Grantable to connected apps only — API keys can't manage other keys,
  // so it stays out of API_KEY_SCOPES and the create-key checklist.
  "keys:manage": "List and revoke your API keys",
  "admin:all": "Full access, overrides all scopes",
}

/** Chip-tooltip lookup that tolerates scopes we don't have copy for. */
export function scopeMeaning(scope: string): string | undefined {
  return (SCOPE_INFO as Record<string, string>)[scope]
}
