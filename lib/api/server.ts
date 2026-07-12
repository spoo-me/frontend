import { headers } from "next/headers"

/**
 * Server-side API base for RSC fetches. Walkthrough mode targets the
 * in-repo mock (same origin — the /api/v1 rewrite is browser-only);
 * otherwise the FastAPI origin, mirroring next.config.mjs. The
 * https://spoo.me production fallback loops through Cloudflare if
 * SPOO_API_URL ever goes missing — it's a last resort, not a config.
 */
export async function apiBase() {
  if (process.env.SPOO_MOCK === "1") {
    const host = (await headers()).get("host") ?? "localhost:3000"
    return `http://${host}/api/mock`
  }
  const origin =
    process.env.SPOO_API_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://spoo.me"
      : "http://localhost:8000")
  return `${origin}/api`
}
