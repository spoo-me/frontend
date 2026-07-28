import { describe, expect, it } from "vitest"

import { normalizeDelivery, normalizeEndpoint } from "./webhooks"

describe("normalizeEndpoint", () => {
  it("converts unix-second timestamps to ISO strings", () => {
    const out = normalizeEndpoint({
      id: "wh1",
      url: "https://example.com/hook",
      flavor: "raw",
      status: "active",
      created_at: 1_753_300_000,
      last_delivery_at: 1_753_300_100,
    })
    expect(out.created_at).toBe(new Date(1_753_300_000 * 1000).toISOString())
    expect(out.last_delivery_at).toBe(
      new Date(1_753_300_100 * 1000).toISOString()
    )
  })

  it("keeps null timestamps null", () => {
    const out = normalizeEndpoint({
      id: "wh1",
      url: "https://example.com/hook",
      flavor: "raw",
      status: "active",
      last_delivery_at: null,
      last_success_at: null,
    })
    expect(out.last_delivery_at).toBeNull()
    expect(out.last_success_at).toBeNull()
  })

  it("defaults missing optionals", () => {
    const out = normalizeEndpoint({
      id: "wh1",
      url: "https://example.com/hook",
      flavor: "discord",
      status: "disabled",
    })
    expect(out.description).toBeNull()
    expect(out.events).toEqual([])
    expect(out.scope_links).toBeNull()
    expect(out.disabled_reason).toBeNull()
    expect(out.signing_secret_prefix).toBe("")
    expect(out.consecutive_failures).toBe(0)
    expect(out.total_deliveries).toBe(0)
  })

  it("distinguishes scope_links null (all links) from an explicit list", () => {
    const all = normalizeEndpoint({
      id: "a",
      url: "https://x.example",
      flavor: "raw",
      status: "active",
      scope_links: null,
    })
    const scoped = normalizeEndpoint({
      id: "b",
      url: "https://x.example",
      flavor: "raw",
      status: "active",
      scope_links: ["l1", "l2"],
    })
    expect(all.scope_links).toBeNull()
    expect(scoped.scope_links).toEqual(["l1", "l2"])
  })
})

describe("normalizeDelivery", () => {
  it("maps the attempts array with defaults", () => {
    const out = normalizeDelivery({
      id: "d1",
      webhook_id: "msg_x",
      event_type: "link.clicked",
      status: "failed",
      attempt_count: 2,
      attempts: [
        {
          attempted_at: 1_753_300_000,
          status_code: 500,
          duration_ms: 340,
          error: "status 500",
          response_body: "oops",
        },
        { attempted_at: 1_753_300_005 },
      ],
      created_at: 1_753_299_990,
    })
    expect(out.attempts).toHaveLength(2)
    expect(out.attempts[0].status_code).toBe(500)
    expect(out.attempts[0].attempted_at).toBe(
      new Date(1_753_300_000 * 1000).toISOString()
    )
    expect(out.attempts[1].status_code).toBeNull()
    expect(out.attempts[1].error).toBeNull()
  })

  it("handles empty attempts and missing flags", () => {
    const out = normalizeDelivery({
      id: "d1",
      webhook_id: "msg_x",
      event_type: "webhook.test",
      status: "pending",
    })
    expect(out.attempts).toEqual([])
    expect(out.is_test).toBe(false)
    expect(out.attempt_count).toBe(0)
    expect(out.next_attempt_at).toBeNull()
  })
})
