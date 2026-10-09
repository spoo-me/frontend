import { describe, expect, it } from "vitest"

import { limitView, versionIsStale } from "./use-entitlements"

describe("versionIsStale", () => {
  it("is stale only when both sides are known and differ", () => {
    expect(versionIsStale(3, 4)).toBe(true)
    expect(versionIsStale(3, 3)).toBe(false)
    expect(versionIsStale(undefined, 4)).toBe(false)
    expect(versionIsStale(3, null)).toBe(false)
  })
})

describe("limitView", () => {
  it("counts remaining and flags the limit", () => {
    expect(limitView({ max: 5, used: 2 })).toEqual({
      max: 5,
      used: 2,
      remaining: 3,
      atLimit: false,
      unlimited: false,
    })
    expect(limitView({ max: 1, used: 1 }).atLimit).toBe(true)
    expect(limitView({ max: 1, used: 3 }).remaining).toBe(0)
  })

  it("treats -1 as unlimited", () => {
    const v = limitView({ max: -1, used: 40 })
    expect(v.unlimited).toBe(true)
    expect(v.atLimit).toBe(false)
    expect(v.remaining).toBe(Number.POSITIVE_INFINITY)
  })

  it("fails closed with no block", () => {
    const v = limitView(undefined)
    expect(v.max).toBe(0)
    expect(v.atLimit).toBe(true)
  })

  it("a null used reads as zero, not a dash", () => {
    expect(limitView({ max: 90, used: null }).used).toBe(0)
  })
})
