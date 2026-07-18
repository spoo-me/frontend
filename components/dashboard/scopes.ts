import { API_KEY_SCOPES } from "@/lib/api"

/**
 * What each scope grants, in plain words — the ONE source for the developer
 * page's create-key checklist and every scope chip tooltip (keys and app
 * grants alike). Mirrors the backend's shared/scopes.py copy.
 *
 * `keys:manage` is not creatable on API keys (so it's absent from
 * API_KEY_SCOPES), but connected apps like spoo-cli hold it, so its copy
 * lives here for the app-grant chips.
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
  "keys:manage": "Create, list, and delete your API keys",
  "admin:all": "Full access, overrides all scopes",
}

/** Chip-tooltip lookup that tolerates scopes we don't have copy for. */
export function scopeMeaning(scope: string): string | undefined {
  return (SCOPE_INFO as Record<string, string>)[scope]
}
