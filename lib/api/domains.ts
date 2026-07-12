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

/** How ownership is proven — mirrors the backend VerificationMethod enum.
 * `cf_http_dcv` is the shipping path (Cloudflare SaaS); the rest exist for
 * self-host deployments. */
export type VerificationMethod =
  | "cf_http_dcv"
  | "cf_delegated_dcv"
  | "cname"
  | "a_record"
  | "txt_challenge"
  | "system"

export type CustomDomain = {
  id: string
  fqdn: string
  status: DomainStatus
  verification_method: VerificationMethod
  created_at?: string
  last_verified_at?: string | null
  last_verification_error?: string | null
  root_redirect?: string | null
  not_found_redirect?: string | null
  custom_robots_txt?: string | null
  dns_records: DnsRecord[]
  setup_notes: string[]
}

/** The wire speaks lowercase status ("pending"); the app speaks uppercase. */
type DomainWire = Omit<CustomDomain, "status"> & { status: string }

function fromWire(d: DomainWire): CustomDomain {
  return { ...d, status: d.status.toUpperCase() as DomainStatus }
}

/** Register a domain — born PENDING; publish dns_records, then verify. */
export function createCustomDomain(fqdn: string) {
  return authedFetch("/api/v1/custom-domains", jsonInit("POST", { fqdn }))
    .then((r) => parse<DomainWire>(r))
    .then(fromWire)
}

export function listCustomDomains() {
  return authedFetch("/api/v1/custom-domains", { method: "GET" })
    .then((r) => parse<{ items: DomainWire[]; total: number }>(r))
    .then(({ items, total }) => ({ items: items.map(fromWire), total }))
}

export function getCustomDomain(id: string) {
  return authedFetch(`/api/v1/custom-domains/${encodeURIComponent(id)}`, {
    method: "GET",
  })
    .then((r) => parse<DomainWire>(r))
    .then(fromWire)
}

export function verifyCustomDomain(id: string) {
  return authedFetch(
    `/api/v1/custom-domains/${encodeURIComponent(id)}/verify`,
    {
      method: "POST",
    }
  )
    .then((r) => parse<DomainWire>(r))
    .then(fromWire)
}

export function updateCustomDomain(
  id: string,
  input: Partial<{
    root_redirect: string | null
    not_found_redirect: string | null
    custom_robots_txt: string | null
  }>
) {
  return authedFetch(
    `/api/v1/custom-domains/${encodeURIComponent(id)}`,
    jsonInit("PATCH", input)
  )
    .then((r) => parse<DomainWire>(r))
    .then(fromWire)
}

/** Revoke returns a receipt, not the domain doc. */
export type DomainDeleteResult = {
  id: string
  fqdn: string
  cascade: boolean
  urls_deleted: number
}

export function revokeCustomDomain(id: string, cascade = false) {
  return authedFetch(
    `/api/v1/custom-domains/${encodeURIComponent(id)}?cascade=${cascade}`,
    { method: "DELETE" }
  ).then((r) => parse<DomainDeleteResult>(r))
}
