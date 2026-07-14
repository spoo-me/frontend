import { describe, expect, it } from "vitest"

import { mergeRecent, validRecents } from "./emoji-recents"

describe("mergeRecent", () => {
  it("moves an existing pick to the front (dedupe)", () => {
    expect(mergeRecent(["😀", "🚀", "🍎"], "🚀")).toEqual(["🚀", "😀", "🍎"])
  })

  it("prepends a new pick", () => {
    expect(mergeRecent(["😀", "🚀"], "🍎")).toEqual(["🍎", "😀", "🚀"])
  })

  it("caps the list, keeping most-recent-first", () => {
    const existing = Array.from({ length: 24 }, (_, i) => `e${i}`)
    const out = mergeRecent(existing, "new", 24)
    expect(out).toHaveLength(24)
    expect(out[0]).toBe("new")
    expect(out).not.toContain("e23")
  })
})

describe("validRecents", () => {
  it("keeps only entries still in the accepted set, in order", () => {
    expect(validRecents(["😀", "🚀", "🍎"], new Set(["😀", "🍎"]))).toEqual([
      "😀",
      "🍎",
    ])
  })

  it("dedupes while intersecting", () => {
    expect(validRecents(["😀", "😀", "🚀"], ["😀", "🚀"])).toEqual(["😀", "🚀"])
  })

  it("honours the cap", () => {
    const stored = Array.from({ length: 30 }, (_, i) => `e${i}`)
    const out = validRecents(stored, stored, 10)
    expect(out).toHaveLength(10)
  })
})
