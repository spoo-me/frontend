import { authedFetch, jsonInit, parse } from "./client"

export type DnsRecord = {
  type: "CNAME" | "TXT" | "A"
  name: string
  value: string
  purpose?: string | null
}

export type DomainStatus =
  | "PENDING"
  | "VERIFYING"
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED"

export type CustomDomain = {
  id: string
  fqdn: string
  status: DomainStatus
  created_at?: string
  last_verified_at?: string | null
  last_verification_error?: string | null
  cf_status?: string | null
  cf_ssl_status?: string | null
  root_redirect?: string | null
  not_found_redirect?: string | null
  custom_robots_txt?: string | null
  dns_records: DnsRecord[]
  setup_notes: string[]
}

/** Register a domain — born PENDING; publish dns_records, then verify. */
export function createCustomDomain(fqdn: string) {
  return authedFetch("/api/v1/custom-domains", jsonInit("POST", { fqdn })).then(
    (r) => parse<CustomDomain>(r),
  )
}

export function listCustomDomains() {
  return authedFetch("/api/v1/custom-domains", { method: "GET" }).then((r) =>
    parse<{ items: CustomDomain[]; total: number }>(r),
  )
}

export function getCustomDomain(id: string) {
  return authedFetch(`/api/v1/custom-domains/${encodeURIComponent(id)}`, {
    method: "GET",
  }).then((r) => parse<CustomDomain>(r))
}

export function verifyCustomDomain(id: string) {
  return authedFetch(
    `/api/v1/custom-domains/${encodeURIComponent(id)}/verify`,
    { method: "POST" },
  ).then((r) => parse<CustomDomain>(r))
}

export function updateCustomDomain(
  id: string,
  input: Partial<{
    root_redirect: string | null
    not_found_redirect: string | null
    custom_robots_txt: string | null
  }>,
) {
  return authedFetch(
    `/api/v1/custom-domains/${encodeURIComponent(id)}`,
    jsonInit("PATCH", input),
  ).then((r) => parse<CustomDomain>(r))
}

export function revokeCustomDomain(id: string, cascade = false) {
  return authedFetch(
    `/api/v1/custom-domains/${encodeURIComponent(id)}?cascade=${cascade}`,
    { method: "DELETE" },
  ).then((r) => parse<CustomDomain>(r))
}
