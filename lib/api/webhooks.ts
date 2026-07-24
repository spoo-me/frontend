import { authedFetch, jsonInit, parse } from "./client"

export type WebhookFlavor = "raw" | "discord" | "slack"
export type WebhookStatus = "active" | "paused" | "disabled"
export type WebhookDisabledReason =
  | "gone"
  | "consecutive_failures"
  | "secret_unreadable"
  | "admin"
export type WebhookDeliveryStatus = "pending" | "success" | "failed"

export type WebhookEndpoint = {
  id: string
  url: string
  description: string | null
  events: string[]
  /** Null means all links, including ones created later. */
  scope_links: string[] | null
  flavor: WebhookFlavor
  status: WebhookStatus
  disabled_reason: WebhookDisabledReason | null
  signing_secret_prefix: string
  consecutive_failures: number
  total_deliveries: number
  total_successes: number
  last_delivery_at: string | null
  last_success_at: string | null
  last_failure_reason: string | null
  created_at: string
}

export type WebhookEndpointCreated = WebhookEndpoint & {
  /** Full signing secret — only returned once, at creation. */
  signing_secret: string
}

export type WebhookDeliveryAttempt = {
  attempted_at: string
  status_code: number | null
  duration_ms: number | null
  error: string | null
  response_body: string | null
}

export type WebhookDelivery = {
  id: string
  webhook_id: string
  event_type: string
  is_test: boolean
  status: WebhookDeliveryStatus
  attempt_count: number
  attempts: WebhookDeliveryAttempt[]
  next_attempt_at: string | null
  created_at: string
}

export type WebhookEventType = {
  type: string
  category: string
  description: string
  frequency: string
  sample: Record<string, unknown>
}

export const WEBHOOK_FLAVORS = ["raw", "discord", "slack"] as const

/** Wire shapes (backend webhook DTOs): timestamps are Unix SECONDS,
    the list envelopes are `endpoints` / `deliveries`. Normalized here so
    the rest of the app keeps ISO strings, like every other resource. */
type EndpointWire = {
  id: string
  url: string
  description?: string | null
  events?: string[]
  scope_links?: string[] | null
  flavor: WebhookFlavor
  status: WebhookStatus
  disabled_reason?: string | null
  signing_secret_prefix?: string | null
  consecutive_failures?: number
  total_deliveries?: number
  total_successes?: number
  last_delivery_at?: number | null
  last_success_at?: number | null
  last_failure_reason?: string | null
  created_at?: number | null
}

type AttemptWire = {
  attempted_at?: number | null
  status_code?: number | null
  duration_ms?: number | null
  error?: string | null
  response_body?: string | null
}

type DeliveryWire = {
  id: string
  webhook_id: string
  event_type: string
  is_test?: boolean
  status: WebhookDeliveryStatus
  attempt_count?: number
  attempts?: AttemptWire[]
  next_attempt_at?: number | null
  created_at?: number | null
}

const isoOf = (unixSeconds: number | null | undefined) =>
  unixSeconds == null ? null : new Date(unixSeconds * 1000).toISOString()

export function normalizeEndpoint(w: EndpointWire): WebhookEndpoint {
  return {
    id: w.id,
    url: w.url,
    description: w.description ?? null,
    events: w.events ?? [],
    scope_links: w.scope_links ?? null,
    flavor: w.flavor,
    status: w.status,
    disabled_reason: (w.disabled_reason ??
      null) as WebhookDisabledReason | null,
    signing_secret_prefix: w.signing_secret_prefix ?? "",
    consecutive_failures: w.consecutive_failures ?? 0,
    total_deliveries: w.total_deliveries ?? 0,
    total_successes: w.total_successes ?? 0,
    last_delivery_at: isoOf(w.last_delivery_at),
    last_success_at: isoOf(w.last_success_at),
    last_failure_reason: w.last_failure_reason ?? null,
    created_at: isoOf(w.created_at) ?? "",
  }
}

export function normalizeDelivery(w: DeliveryWire): WebhookDelivery {
  return {
    id: w.id,
    webhook_id: w.webhook_id,
    event_type: w.event_type,
    is_test: w.is_test ?? false,
    status: w.status,
    attempt_count: w.attempt_count ?? 0,
    attempts: (w.attempts ?? []).map((a) => ({
      attempted_at: isoOf(a.attempted_at) ?? "",
      status_code: a.status_code ?? null,
      duration_ms: a.duration_ms ?? null,
      error: a.error ?? null,
      response_body: a.response_body ?? null,
    })),
    next_attempt_at: isoOf(w.next_attempt_at),
    created_at: isoOf(w.created_at) ?? "",
  }
}

export type CreateWebhookInput = {
  url: string
  events: string[]
  description?: string
  /** Omit for all links. */
  scope_links?: string[]
  flavor?: WebhookFlavor
}

export type UpdateWebhookInput = {
  url?: string
  events?: string[]
  description?: string | null
  /** Null switches to all links; omit to keep the current scope. */
  scope_links?: string[] | null
  flavor?: WebhookFlavor
  status?: "active" | "paused"
}

export function listWebhooks() {
  return authedFetch("/api/v1/webhooks", { method: "GET" }).then(
    async (r): Promise<{ items: WebhookEndpoint[] }> => {
      const wire = await parse<{ endpoints: EndpointWire[] }>(r)
      return { items: (wire.endpoints ?? []).map(normalizeEndpoint) }
    }
  )
}

export function getWebhook(id: string) {
  return authedFetch(`/api/v1/webhooks/${encodeURIComponent(id)}`, {
    method: "GET",
  }).then(async (r) => normalizeEndpoint(await parse<EndpointWire>(r)))
}

export function createWebhook(input: CreateWebhookInput) {
  return authedFetch("/api/v1/webhooks", jsonInit("POST", input)).then(
    async (r): Promise<WebhookEndpointCreated> => {
      const wire = await parse<EndpointWire & { signing_secret: string }>(r)
      return { ...normalizeEndpoint(wire), signing_secret: wire.signing_secret }
    }
  )
}

export function updateWebhook(id: string, input: UpdateWebhookInput) {
  return authedFetch(
    `/api/v1/webhooks/${encodeURIComponent(id)}`,
    jsonInit("PATCH", input)
  ).then(async (r) => normalizeEndpoint(await parse<EndpointWire>(r)))
}

export async function deleteWebhook(id: string) {
  const res = await authedFetch(`/api/v1/webhooks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  if (!res.ok) await parse(res)
}

/** Sends the event type's documented sample through the real pipeline. */
export function sendTestWebhook(id: string, eventType = "webhook.test") {
  return authedFetch(
    `/api/v1/webhooks/${encodeURIComponent(id)}/test`,
    jsonInit("POST", { event_type: eventType })
  ).then(async (r) => normalizeDelivery(await parse<DeliveryWire>(r)))
}

export function listWebhookDeliveries(
  id: string,
  opts?: { page?: number; pageSize?: number; status?: WebhookDeliveryStatus }
) {
  const q = new URLSearchParams()
  if (opts?.page) q.set("page", String(opts.page))
  if (opts?.pageSize) q.set("page_size", String(opts.pageSize))
  if (opts?.status) q.set("status", opts.status)
  const qs = q.size ? `?${q}` : ""
  return authedFetch(
    `/api/v1/webhooks/${encodeURIComponent(id)}/deliveries${qs}`,
    { method: "GET" }
  ).then(
    async (
      r
    ): Promise<{
      items: WebhookDelivery[]
      total: number
      page: number
      pageSize: number
      hasNext: boolean
    }> => {
      const wire = await parse<{
        deliveries: DeliveryWire[]
        total: number
        page: number
        page_size: number
      }>(r)
      const items = (wire.deliveries ?? []).map(normalizeDelivery)
      return {
        items,
        total: wire.total ?? items.length,
        page: wire.page ?? 1,
        pageSize: wire.page_size ?? items.length,
        hasNext: (wire.page ?? 1) * (wire.page_size ?? 25) < (wire.total ?? 0),
      }
    }
  )
}

export function retryWebhookDelivery(id: string, deliveryId: string) {
  return authedFetch(
    `/api/v1/webhooks/${encodeURIComponent(id)}/deliveries/${encodeURIComponent(deliveryId)}/retry`,
    jsonInit("POST", {})
  ).then(async (r) => normalizeDelivery(await parse<DeliveryWire>(r)))
}

/** Public catalog — no auth, safe to fetch before the page is gated. */
export function listWebhookEventTypes() {
  return fetch("/api/v1/webhooks/event-types", { method: "GET" }).then(
    async (r): Promise<WebhookEventType[]> => {
      const wire = await parse<{ event_types: WebhookEventType[] }>(r)
      return wire.event_types ?? []
    }
  )
}
