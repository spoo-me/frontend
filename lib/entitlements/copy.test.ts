import { describe, expect, it } from "vitest"

import { FEATURE_COPY, LIMIT_COPY, formatLimit } from "./copy"
import { FEATURE_KEYS, LIMIT_KEYS, MOCK_PLAN_DEFAULTS } from "./keys"

describe("entitlement copy drift guard", () => {
  it("has copy for every feature key the mock serves", () => {
    for (const key of FEATURE_KEYS) {
      expect(FEATURE_COPY[key]?.title, key).toBeTruthy()
      expect(FEATURE_COPY[key]?.blurb, key).toBeTruthy()
    }
    expect(Object.keys(FEATURE_COPY).sort()).toEqual([...FEATURE_KEYS].sort())
  })

  it("has copy for every limit key the mock serves", () => {
    for (const key of LIMIT_KEYS) {
      expect(LIMIT_COPY[key]?.label, key).toBeTruthy()
      expect(LIMIT_COPY[key]?.noun, key).toBeTruthy()
    }
    expect(Object.keys(LIMIT_COPY).sort()).toEqual([...LIMIT_KEYS].sort())
  })

  it("mock plan defaults cover every key", () => {
    for (const plan of ["free", "pro"] as const) {
      expect(Object.keys(MOCK_PLAN_DEFAULTS[plan].features).sort()).toEqual(
        [...FEATURE_KEYS].sort()
      )
      expect(Object.keys(MOCK_PLAN_DEFAULTS[plan].limits).sort()).toEqual(
        [...LIMIT_KEYS].sort()
      )
    }
  })

  it("copy never uses an em dash", () => {
    const all = [
      ...Object.values(FEATURE_COPY).flatMap((c) => [c.title, c.blurb]),
      ...Object.values(LIMIT_COPY).flatMap((c) => [c.label, c.noun]),
    ]
    for (const text of all) expect(text).not.toContain("—")
  })

  it("formats limits for humans", () => {
    expect(formatLimit("analytics_window_days", 730)).toBe("2 years")
    expect(formatLimit("analytics_window_days", 90)).toBe("90 days")
    expect(formatLimit("api_rate_multiplier", 5)).toBe("5x")
    expect(formatLimit("custom_domains_max", -1)).toBe("Unlimited")
    expect(formatLimit("custom_domains_max", 5)).toBe("5")
  })
})
