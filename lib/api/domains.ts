import { authedFetch, jsonInit, parse } from "./client"

export type DnsRecord = {
  type: "CNAME" | "TXT" | "A"
  name: string
  value: string
  purpose?: string | null
}

export type CustomDomain = {
  id: string
  fqdn: string
  status: string
  dns_records: DnsRecord[]
  setup_notes: string[]
}

/** Register a domain — born PENDING; publish dns_records, then verify. */
export function createCustomDomain(fqdn: string) {
  return authedFetch("/api/v1/custom-domains", jsonInit("POST", { fqdn })).then(
    (r) => parse<CustomDomain>(r),
  )
}
