import { describe, expect, it } from "vitest"

import { MOCK_PLAN_DEFAULTS } from "./entitlements/keys"
import {
  buildPlanGroups,
  foundingIsOpen,
  foundingRemaining,
  yearlySavingPercent,
} from "./plan-table"

const plans = [
  { name: "free" as const, ...MOCK_PLAN_DEFAULTS.free },
  { name: "pro" as const, ...MOCK_PLAN_DEFAULTS.pro },
]

function row(label: string) {
  const found = buildPlanGroups(plans)
    .flatMap((g) => g.rows)
    .find((r) => r.label === label)
  if (!found) throw new Error(`no row ${label}`)
  return found
}

describe("buildPlanGroups", () => {
  it("phrases every number from the plans response", () => {
    expect(row("Domains").cells).toEqual({
      free: { kind: "needs", plan: "Pro" },
      pro: { kind: "value", text: "5 custom domains" },
      business: { kind: "value", text: "5 custom domains" },
    })
    expect(row("Analytics window").cells.free).toEqual({
      kind: "value",
      text: "90 days of history",
    })
    expect(row("Analytics window").cells.pro).toEqual({
      kind: "value",
      text: "2 years of history",
    })
    expect(row("Endpoints").cells.free).toEqual({
      kind: "value",
      text: "1 webhook endpoint",
    })
    expect(row("Bulk batch").cells.pro).toEqual({
      kind: "value",
      text: "1,000 per batch",
    })
    expect(row("API rate").cells.pro).toEqual({
      kind: "value",
      text: "5x API rate",
    })
  })

  it("names the plan a missing feature needs and never leaves a dash", () => {
    expect(row("Geo targeting").cells.free).toEqual({
      kind: "needs",
      plan: "Pro",
    })
    expect(row("Geo targeting").cells.pro).toEqual({
      kind: "value",
      text: "Included",
    })
    expect(row("Team seats").cells).toEqual({
      free: { kind: "needs", plan: "Business" },
      pro: { kind: "needs", plan: "Business" },
      business: { kind: "later" },
    })
  })

  it("never lists the two unreleased features", () => {
    const labels = buildPlanGroups(plans)
      .flatMap((g) => g.rows)
      .map((r) => r.label)
    expect(labels).not.toContain("Every click recorded")
    expect(labels).not.toContain("Domain polish")
  })

  it("marks plan-dependent cells as loading until the plans arrive", () => {
    const rows = buildPlanGroups(undefined).flatMap((g) => g.rows)
    const domains = rows.find((r) => r.label === "Domains")
    expect(domains?.cells.pro.kind).toBe("loading")
    expect(rows.find((r) => r.label === "Links and clicks")?.cells.pro).toEqual(
      {
        kind: "value",
        text: "Unlimited",
      }
    )
  })
})

describe("yearlySavingPercent", () => {
  it("compares the year price to twelve months", () => {
    expect(
      yearlySavingPercent({
        monthly: { amount: 15, currency: "USD" },
        year: { amount: 144, currency: "USD" },
      })
    ).toBe(20)
    expect(
      yearlySavingPercent({ monthly: { amount: 15, currency: "USD" } })
    ).toBeNull()
    expect(yearlySavingPercent(undefined)).toBeNull()
  })
})

describe("founding window", () => {
  const now = Date.parse("2026-09-05T00:00:00Z")
  const base = {
    monthly: { amount: 9, currency: "USD" },
    year: { amount: 90, currency: "USD" },
    seats_total: 100,
  }
  it("is open only with seats and time left", () => {
    const until = "2026-11-05T00:00:00Z"
    expect(foundingIsOpen({ ...base, seats_left: 3, until }, now)).toBe(true)
    expect(foundingIsOpen({ ...base, seats_left: 0, until }, now)).toBe(false)
    expect(foundingIsOpen({ ...base, seats_left: null, until }, now)).toBe(
      false
    )
    expect(
      foundingIsOpen(
        { ...base, seats_left: 3, until: "2026-09-04T00:00:00Z" },
        now
      )
    ).toBe(false)
    expect(foundingIsOpen(null, now)).toBe(false)
  })

  it("says what is left in seats, or in days", () => {
    const until = "2026-09-08T12:00:00Z"
    expect(foundingRemaining({ ...base, seats_left: 37, until }, now)).toBe(
      "37 of 100 seats left"
    )
    expect(foundingRemaining({ ...base, seats_left: null, until }, now)).toBe(
      "4 days left"
    )
  })
})
