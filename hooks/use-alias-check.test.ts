import { describe, expect, it } from "vitest"

import {
  aliasHintMessage,
  aliasVerdictKey,
  EMOJI_POLICY_GENERIC,
  emojiPolicyHint,
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

  it("gives an accurate generic emoji_policy line without misleading examples", () => {
    const msg = aliasHintMessage("emoji_policy", true)
    expect(msg).toBe(EMOJI_POLICY_GENERIC)
    expect(msg).not.toContain("flags")
    expect(msg).not.toContain("keycaps")
  })

  it("maps reserved and taken", () => {
    expect(aliasHintMessage("reserved", false)).toBe("That alias is reserved.")
    expect(aliasHintMessage("taken", true)).toBe(
      "That alias is taken, try another."
    )
  })
})

describe("emojiPolicyHint", () => {
  const accepted = new Set(["😃", "🚀", "🎉"])

  it("names a single offender", () => {
    expect(emojiPolicyHint("😃❤️", accepted)).toBe(
      "❤️ won't work in a link address, try another."
    )
  })

  it("names the first offender and counts the rest", () => {
    expect(emojiPolicyHint("❤️✨", accepted)).toBe(
      "❤️ and 1 other won't work in a link address."
    )
    expect(emojiPolicyHint("❤️✨🧨", accepted)).toBe(
      "❤️ and 2 others won't work in a link address."
    )
  })

  it("falls back to the accurate generic when the set is unavailable", () => {
    expect(emojiPolicyHint("😃❤️", null)).toBe(EMOJI_POLICY_GENERIC)
  })

  it("falls back to generic when nothing is flagged locally", () => {
    // Server said emoji_policy but the client cannot pinpoint locally.
    expect(emojiPolicyHint("🚀🎉", accepted)).toBe(EMOJI_POLICY_GENERIC)
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
