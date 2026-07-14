import { describe, expect, it } from "vitest"

import { aliasHintMessage } from "./use-alias-check"

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
