import { describe, expect, it } from "vitest"

import {
  aliasHintMessage,
  aliasVerdictKey,
  resolveAliasVerdict,
} from "./use-alias-check"

describe("aliasHintMessage", () => {
  it("phrases length differently per lane", () => {
    expect(aliasHintMessage("length", true)).toBe("Up to 15 emoji.")
    expect(aliasHintMessage("length", false)).toBe(
      "3-16 characters: letters, numbers, - and _"
    )
  })

  it("keeps the mixed-alias copy for format", () => {
    expect(aliasHintMessage("format", true)).toBe(
      "Letters, numbers, - and _, or emoji. Not both."
    )
  })

  it("teaches the address-bar rule for emoji_policy", () => {
    expect(aliasHintMessage("emoji_policy", true)).toContain("address bar")
  })

  it("maps reserved and taken", () => {
    expect(aliasHintMessage("reserved", false)).toBe("That alias is reserved.")
    expect(aliasHintMessage("taken", true)).toBe(
      "That alias is taken, try another."
    )
  })
})

describe("resolveAliasVerdict", () => {
  const key = (a: string, d?: string) => aliasVerdictKey(a, d)

  it("is idle when empty or disabled", () => {
    expect(resolveAliasVerdict("", undefined, true, null).state).toBe("idle")
    expect(resolveAliasVerdict("hello", undefined, false, null).state).toBe(
      "idle"
    )
  })

  it("gates length locally without a server answer", () => {
    expect(resolveAliasVerdict("ab", undefined, true, null)).toMatchObject({
      state: "problem",
      reason: "length",
    })
    // 16 emoji > 15 grapheme cap
    expect(
      resolveAliasVerdict("🚀".repeat(16), undefined, true, null)
    ).toMatchObject({ state: "problem", reason: "length" })
  })

  it("checks while no matching cached answer exists", () => {
    expect(resolveAliasVerdict("🚀🎉", undefined, true, null).state).toBe(
      "checking"
    )
  })

  it("resolves a failed check to a non-blocking unknown, never spinning", () => {
    const cached = { key: key("🚀🎉"), kind: "fail" as const }
    expect(resolveAliasVerdict("🚀🎉", undefined, true, cached).state).toBe(
      "unknown"
    )
  })

  it("maps ok answers to available and problem", () => {
    const ok = {
      key: key("cooltag"),
      kind: "ok" as const,
      available: true,
      reason: null,
    }
    expect(resolveAliasVerdict("cooltag", undefined, true, ok).state).toBe(
      "available"
    )
    const taken = {
      key: key("cooltag"),
      kind: "ok" as const,
      available: false,
      reason: "taken" as const,
    }
    expect(
      resolveAliasVerdict("cooltag", undefined, true, taken)
    ).toMatchObject({ state: "problem", reason: "taken" })
  })

  it("ignores a cached answer from a different domain (rechecks)", () => {
    const cached = {
      key: key("cooltag", "custom.example"),
      kind: "ok" as const,
      available: true,
      reason: null,
    }
    // Same alias, default domain (no domain) -> key differs -> checking.
    expect(resolveAliasVerdict("cooltag", undefined, true, cached).state).toBe(
      "checking"
    )
  })
})
