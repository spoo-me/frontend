/**
 * Addressing for the link detail route /dashboard/links/{domain}/{alias}
 * and the ?link= sheet param.
 *
 * The domain segment is always explicit: the link's custom domain when it
 * has one, otherwise the host the dashboard is served from — the same way
 * the stats lookup treats the current host. The backend resolves any of
 * its own hostnames to default-domain links, so dev, beta, prod and
 * self-hosted deploys all stay correct without hardcoding spoo.me.
 */

/**
 * The domain segment for a link: its custom domain, else the current host.
 *
 * Client-only: the inline window.location read returns "" during SSR, so
 * server-rendered call sites must resolve the host via the useCurrentHost
 * hook instead (as the public stats view does); every current caller renders
 * from client-fetched query data, so no href is computed server-side.
 */
export function detailDomainOf(domain?: string | null): string {
  if (domain) return domain
  return typeof window === "undefined" ? "" : window.location.hostname
}

/** Detail-page path for a link, both segments percent-encoded (emoji aliases). */
export function linkDetailPath(link: {
  alias?: string | null
  domain?: string | null
}): string {
  const domain = encodeURIComponent(detailDomainOf(link.domain))
  return `/dashboard/links/${domain}/${encodeURIComponent(link.alias ?? "")}`
}

/**
 * ?link= sheet param: bare alias for default-domain links (existing shared
 * URLs keep working), domain/alias for custom-domain ones — aliases never
 * contain a slash, so the split is unambiguous.
 */
export function linkSheetParam(link: {
  alias?: string | null
  domain?: string | null
}): string {
  return link.domain ? `${link.domain}/${link.alias ?? ""}` : (link.alias ?? "")
}

export function parseLinkSheetParam(value: string): {
  domain: string | null
  alias: string
} {
  const slash = value.indexOf("/")
  return slash === -1
    ? { domain: null, alias: value }
    : { domain: value.slice(0, slash), alias: value.slice(slash + 1) }
}
