import { describe, expect, it } from "vitest"

import { formatRemaining } from "./countdown"

describe("formatRemaining", () => {
  it("shows a clock under a day", () => {
    expect(formatRemaining((3 * 3600 + 12 * 60 + 44) * 1000)).toBe("03:12:44")
  })
  it("prefixes whole days past 24h", () => {
    expect(formatRemaining((5 * 86_400 + 3 * 3600 + 12 * 60 + 44) * 1000)).toBe(
      "5d 03:12:44"
    )
  })
  it("floors to the second and never goes negative", () => {
    expect(formatRemaining(999)).toBe("00:00:00")
    expect(formatRemaining(-5000)).toBe("00:00:00")
  })
})
