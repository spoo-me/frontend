import { describe, expect, it } from "vitest"

import {
  TAG_ICON_KEYS,
  TAG_MAX_LENGTH,
  normalizeTagName,
  sameTagIds,
} from "./tags"
import { TAG_ICONS } from "@/components/dashboard/tags/tag-glyph"

describe("normalizeTagName", () => {
  it("counts code points, not UTF-16 units", () => {
    const astral = "𝔞".repeat(TAG_MAX_LENGTH)
    expect(normalizeTagName(astral)).toBe(astral)
    expect(normalizeTagName(`${astral}𝔞`)).toBeNull()
  })
  it("trims, lowercases and collapses whitespace like the server", () => {
    expect(normalizeTagName("  Launch   Q3 ")).toBe("launch q3")
  })

  it("keeps letters from any script and combining marks", () => {
    expect(normalizeTagName("हिंदी")).toBe("हिंदी")
    expect(normalizeTagName("v1.2-rc_1")).toBe("v1.2-rc_1")
  })

  it("rejects what the server rejects", () => {
    expect(normalizeTagName("")).toBeNull()
    expect(normalizeTagName("   ")).toBeNull()
    expect(normalizeTagName("a,b")).toBeNull()
    expect(normalizeTagName("tag!")).toBeNull()
    expect(normalizeTagName("a".repeat(TAG_MAX_LENGTH + 1))).toBeNull()
    expect(normalizeTagName("a".repeat(TAG_MAX_LENGTH))).toHaveLength(
      TAG_MAX_LENGTH
    )
  })
})

describe("sameTagIds", () => {
  it("treats undefined, null and [] alike", () => {
    expect(sameTagIds(undefined, [])).toBe(true)
    expect(sameTagIds(null, undefined)).toBe(true)
  })

  it("is order-sensitive, matching the whole-list PATCH semantics", () => {
    expect(sameTagIds(["a", "b"], ["a", "b"])).toBe(true)
    expect(sameTagIds(["a", "b"], ["b", "a"])).toBe(false)
    expect(sameTagIds(["a"], ["a", "b"])).toBe(false)
  })
})

describe("TAG_ICON_KEYS", () => {
  it("every curated key has a glyph and every glyph is a curated key", () => {
    for (const key of TAG_ICON_KEYS) expect(TAG_ICONS[key]).toBeTypeOf("object")
    expect(Object.keys(TAG_ICONS).sort()).toEqual([...TAG_ICON_KEYS].sort())
  })
})
