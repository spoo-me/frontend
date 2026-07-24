import { NextResponse, type NextRequest } from "next/server"

import type { MockDelivery, MockWebhook } from "./seed"

/** Mock for /api/v1/webhooks/* — wire shapes mirror the real backend DTOs
 *  (Unix-second timestamps, `endpoints`/`deliveries` envelopes, the signing
 *  secret only in the 201 create response). Testable-state idiom: a test
 *  send to an endpoint whose URL contains "fail" fails, like contact.
 */

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, init)
}

function fail(status: number, code: string, error: string, field?: string) {
  return json({ error, code, ...(field ? { field } : {}) }, { status })
}

const unix = (iso: string | null) =>
  iso ? Math.floor(new Date(iso).getTime() / 1000) : null

const endpointToWire = (w: MockWebhook) => ({
  id: w.id,
  url: w.url,
  description: w.description,
  events: w.events,
  scope_links: w.scope_links,
  flavor: w.flavor,
  status: w.status,
  disabled_reason: w.disabled_reason,
  signing_secret_prefix: w.signing_secret_prefix,
  consecutive_failures: w.consecutive_failures,
  total_deliveries: w.total_deliveries,
  total_successes: w.total_successes,
  last_delivery_at: unix(w.last_delivery_at),
  last_success_at: unix(w.last_success_at),
  last_failure_reason: w.last_failure_reason,
  created_at: unix(w.created_at) ?? 0,
})

const deliveryToWire = (d: MockDelivery) => ({
  id: d.id,
  webhook_id: d.webhook_id,
  event_type: d.event_type,
  is_test: d.is_test,
  status: d.status,
  attempt_count: d.attempt_count,
  attempts: d.attempts.map((a) => ({
    attempted_at: unix(a.attempted_at) ?? 0,
    status_code: a.status_code,
    duration_ms: a.duration_ms,
    error: a.error,
    response_body: a.response_body,
  })),
  next_attempt_at: unix(d.next_attempt_at),
  created_at: unix(d.created_at) ?? 0,
})

/** Mirrors the backend registry (5 subscribable events + webhook.test). */
const EVENT_TYPES = [
  {
    type: "link.created",
    category: "link",
    description: "A short link was created.",
    frequency: "low",
    sample: { link: { alias: "summer-drop" } },
  },
  {
    type: "link.updated",
    category: "link",
    description:
      "A short link was edited (any field, status included). `changes` maps each edited field to its old and new values.",
    frequency: "low",
    sample: { link: { alias: "summer-drop" }, changes: {} },
  },
  {
    type: "link.deleted",
    category: "link",
    description: "A short link was deleted.",
    frequency: "low",
    sample: { link: { alias: "summer-drop" } },
  },
  {
    type: "link.clicked",
    category: "link",
    description:
      "A tracked click was recorded (bots included — check `is_bot`). Edge-served clicks are not tracked.",
    frequency: "high",
    sample: { alias: "summer-drop", country: "IN" },
  },
  {
    type: "link.expired",
    category: "link",
    description:
      "A link expired (max clicks reached, or its expiry time was discovered to have passed).",
    frequency: "low",
    sample: { link: { alias: "summer-drop" }, reason: "max_clicks_reached" },
  },
  {
    type: "webhook.test",
    category: "webhook",
    description: "A test ping sent from the dashboard or API.",
    frequency: "low",
    sample: { message: "If you can read this, your endpoint works." },
  },
]

const rand = () => Math.random().toString(36).slice(2, 8)

type WebhookState = {
  webhooks: MockWebhook[]
  webhookDeliveries: MockDelivery[]
}

export function handleWebhooks(
  req: NextRequest,
  path: string[],
  body: Record<string, unknown>,
  params: URLSearchParams,
  s: WebhookState
): NextResponse | null {
  // path = ["v1", "webhooks", ...rest]
  const rest = path.slice(2)

  if (rest[0] === "event-types" && req.method === "GET")
    return json({ event_types: EVENT_TYPES })

  if (rest.length === 0 && req.method === "GET")
    return json({ endpoints: s.webhooks.map(endpointToWire) })

  if (rest.length === 0 && req.method === "POST") {
    const url = String(body.url ?? "").trim()
    if (!url.startsWith("https://"))
      return fail(422, "validation_error", "url: must be an HTTPS URL", "url")
    const events = Array.isArray(body.events) ? (body.events as string[]) : []
    if (!events.length)
      return fail(
        422,
        "validation_error",
        "events: must contain at least one event type",
        "events"
      )
    const secret = `whsec_${rand()}${rand()}${rand()}${rand()}`
    const endpoint: MockWebhook = {
      id: `wh_${rand()}`,
      url,
      description: body.description ? String(body.description) : null,
      events,
      scope_links: Array.isArray(body.scope_links)
        ? (body.scope_links as string[])
        : null,
      flavor:
        body.flavor === "discord" || body.flavor === "slack"
          ? body.flavor
          : "raw",
      status: "active",
      disabled_reason: null,
      signing_secret_prefix: secret.slice(0, 13),
      consecutive_failures: 0,
      total_deliveries: 0,
      total_successes: 0,
      last_delivery_at: null,
      last_success_at: null,
      last_failure_reason: null,
      created_at: new Date().toISOString(),
    }
    s.webhooks.unshift(endpoint)
    return json(
      { ...endpointToWire(endpoint), signing_secret: secret },
      { status: 201 }
    )
  }

  const endpoint = s.webhooks.find((w) => w.id === rest[0])

  if (rest.length === 1 && req.method === "GET") {
    if (!endpoint) return fail(404, "not_found", "No such endpoint")
    return json(endpointToWire(endpoint))
  }

  if (rest.length === 1 && req.method === "PATCH") {
    if (!endpoint) return fail(404, "not_found", "No such endpoint")
    if ("url" in body) endpoint.url = String(body.url)
    if ("description" in body)
      endpoint.description = body.description ? String(body.description) : null
    if ("events" in body && Array.isArray(body.events))
      endpoint.events = body.events as string[]
    if ("scope_links" in body)
      endpoint.scope_links = Array.isArray(body.scope_links)
        ? (body.scope_links as string[])
        : null
    if ("flavor" in body && typeof body.flavor === "string")
      endpoint.flavor = body.flavor as MockWebhook["flavor"]
    if ("status" in body) {
      const status = String(body.status)
      if (status !== "active" && status !== "paused")
        return fail(
          422,
          "validation_error",
          "status: must be active or paused",
          "status"
        )
      endpoint.status = status
      if (status === "active") {
        endpoint.disabled_reason = null
        endpoint.consecutive_failures = 0
      }
    }
    return json(endpointToWire(endpoint))
  }

  if (rest.length === 1 && req.method === "DELETE") {
    if (!endpoint) return fail(404, "not_found", "No such endpoint")
    s.webhooks = s.webhooks.filter((w) => w !== endpoint)
    s.webhookDeliveries = s.webhookDeliveries.filter(
      (d) => d.endpoint_id !== endpoint.id
    )
    return new NextResponse(null, { status: 204 })
  }

  if (rest[1] === "test" && req.method === "POST") {
    if (!endpoint) return fail(404, "not_found", "No such endpoint")
    const eventType = String(body.event_type ?? "webhook.test")
    if (!EVENT_TYPES.some((e) => e.type === eventType))
      return fail(
        422,
        "validation_error",
        "event_type: unknown event type",
        "event_type"
      )
    const failDelivery = endpoint.url.includes("fail")
    const now = new Date().toISOString()
    const delivery: MockDelivery = {
      id: `whd_${rand()}`,
      endpoint_id: endpoint.id,
      webhook_id: `msg_${rand()}${rand()}`,
      event_type: eventType,
      is_test: true,
      status: failDelivery ? "failed" : "success",
      attempt_count: 1,
      attempts: [
        {
          attempted_at: now,
          status_code: failDelivery ? 500 : 200,
          duration_ms: 140 + Math.floor(Math.random() * 400),
          error: failDelivery ? "status 500" : null,
          response_body: failDelivery ? '{"error":"boom"}' : "ok",
        },
      ],
      next_attempt_at: null,
      created_at: now,
    }
    s.webhookDeliveries.unshift(delivery)
    endpoint.total_deliveries += 1
    endpoint.last_delivery_at = now
    if (!failDelivery) {
      endpoint.total_successes += 1
      endpoint.last_success_at = now
    }
    return json(deliveryToWire(delivery))
  }

  if (rest[1] === "deliveries" && rest.length === 2 && req.method === "GET") {
    if (!endpoint) return fail(404, "not_found", "No such endpoint")
    const status = params.get("status")
    const page = Math.max(1, Number(params.get("page") ?? 1))
    const pageSize = Math.min(
      100,
      Math.max(1, Number(params.get("page_size") ?? 25))
    )
    let rows = s.webhookDeliveries.filter((d) => d.endpoint_id === endpoint.id)
    if (status) rows = rows.filter((d) => d.status === status)
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
    const start = (page - 1) * pageSize
    return json({
      deliveries: rows.slice(start, start + pageSize).map(deliveryToWire),
      total: rows.length,
      page,
      page_size: pageSize,
    })
  }

  if (
    rest[1] === "deliveries" &&
    rest[3] === "retry" &&
    req.method === "POST"
  ) {
    if (!endpoint) return fail(404, "not_found", "No such endpoint")
    const delivery = s.webhookDeliveries.find(
      (d) => d.id === rest[2] && d.endpoint_id === endpoint.id
    )
    if (!delivery) return fail(404, "not_found", "No such delivery")
    const failDelivery = endpoint.url.includes("fail")
    const now = new Date().toISOString()
    delivery.attempts = [
      ...delivery.attempts,
      {
        attempted_at: now,
        status_code: failDelivery ? 500 : 200,
        duration_ms: 140 + Math.floor(Math.random() * 400),
        error: failDelivery ? "status 500" : null,
        response_body: failDelivery ? '{"error":"boom"}' : "ok",
      },
    ]
    delivery.attempt_count = delivery.attempts.length
    delivery.status = failDelivery ? "failed" : "success"
    delivery.next_attempt_at = null
    endpoint.total_deliveries += 1
    endpoint.last_delivery_at = now
    if (!failDelivery) {
      endpoint.total_successes += 1
      endpoint.last_success_at = now
    }
    return json(deliveryToWire(delivery))
  }

  return null
}
