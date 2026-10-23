import { describe, expect, it } from "vitest"

import { paymentLanded, planIsPaid, safeReturnPath } from "./return-flow"

describe("paymentLanded", () => {
  it("waits for the version to move past the baseline", () => {
    expect(paymentLanded(3, 3)).toBe(false)
    expect(paymentLanded(3, 4)).toBe(true)
    expect(paymentLanded(3, undefined)).toBe(false)
    expect(paymentLanded(null, 4)).toBe(false)
  })
})

describe("planIsPaid", () => {
  it("counts only a Pro plan in a paid status", () => {
    expect(planIsPaid({ name: "pro", status: "active" })).toBe(true)
    expect(planIsPaid({ name: "pro", status: "cancel_at_period_end" })).toBe(
      true
    )
    expect(planIsPaid({ name: "pro", status: "grace" })).toBe(false)
    expect(planIsPaid({ name: "pro", status: "past_due" })).toBe(false)
    expect(planIsPaid({ name: "free", status: null })).toBe(false)
    expect(planIsPaid(undefined)).toBe(false)
  })
})

describe("safeReturnPath", () => {
  it("keeps dashboard paths and refuses anything else", () => {
    expect(safeReturnPath("/dashboard/links")).toBe("/dashboard/links")
    expect(safeReturnPath("/dashboard/links?tab=x#y")).toBe(
      "/dashboard/links?tab=x#y"
    )
    expect(safeReturnPath("https://evil.example")).toBe("/dashboard")
    expect(safeReturnPath("//evil.example")).toBe("/dashboard")
    expect(safeReturnPath("/\\evil.example")).toBe("/dashboard")
    expect(safeReturnPath("/upgrade")).toBe("/dashboard")
    expect(safeReturnPath("https://[")).toBe("/dashboard")
    expect(safeReturnPath("http://a b")).toBe("/dashboard")
    expect(safeReturnPath(null)).toBe("/dashboard")
  })
})
