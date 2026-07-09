import { authedFetch, jsonInit, parse } from "./client"

/**
 * Per-user page layout docs. The schema is owned by the client
 * (lib/analytics-layout.ts) and versioned inside the doc; the server stores
 * it opaquely. `layout: null` means no override saved — render the default.
 */

export function getPageLayout(page: string) {
  return authedFetch(`/api/v1/me/layouts/${encodeURIComponent(page)}`, {
    method: "GET",
  }).then((r) => parse<{ layout: unknown }>(r))
}

export function putPageLayout(page: string, layout: unknown) {
  return authedFetch(
    `/api/v1/me/layouts/${encodeURIComponent(page)}`,
    jsonInit("PUT", { layout }),
  ).then((r) => parse<{ layout: unknown }>(r))
}

export async function deletePageLayout(page: string) {
  const res = await authedFetch(
    `/api/v1/me/layouts/${encodeURIComponent(page)}`,
    { method: "DELETE" },
  )
  if (!res.ok) await parse(res)
}
