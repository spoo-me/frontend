import { describe, expect, it } from "vitest"

import {
  countGraphemes,
  EMOJI_SUGGEST_POOL,
  isEmojiCandidate,
  suggestEmojiAlias,
} from "./emoji-alias"

describe("countGraphemes", () => {
  it("counts an empty string as zero", () => {
    expect(countGraphemes("")).toBe(0)
  })

  it("counts a skin-tone sequence as one grapheme", () => {
    // 👍 + skin tone modifier = 2 codepoints, 1 user-perceived character.
    expect(countGraphemes("👍🏽")).toBe(1)
  })

  it("counts a ZWJ family as one grapheme", () => {
    expect(countGraphemes("👨‍👩‍👧")).toBe(1)
  })

  it("counts multiple distinct emoji", () => {
    expect(countGraphemes("😀😃🚀")).toBe(3)
  })

  it("counts plain ascii by character", () => {
    expect(countGraphemes("launch")).toBe(6)
  })
})

describe("isEmojiCandidate", () => {
  it("routes plain alnum aliases to the alnum lane", () => {
    expect(isEmojiCandidate("launch")).toBe(false)
    expect(isEmojiCandidate("my_link-1")).toBe(false)
  })

  it("treats empty as not a candidate", () => {
    expect(isEmojiCandidate("")).toBe(false)
  })

  it("routes anything with a non-alnum char to the emoji lane", () => {
    expect(isEmojiCandidate("😀")).toBe(true)
    // Mixed is a candidate here; the server rejects it as `format`.
    expect(isEmojiCandidate("abc😀")).toBe(true)
  })
})

describe("suggestEmojiAlias", () => {
  const pool = new Set(EMOJI_SUGGEST_POOL)

  it("returns the requested grapheme count (default 3)", () => {
    expect(countGraphemes(suggestEmojiAlias())).toBe(3)
    expect(countGraphemes(suggestEmojiAlias(5))).toBe(5)
  })

  it("draws only from the curated pool", () => {
    for (const grapheme of Array.from(suggestEmojiAlias(6))) {
      expect(pool.has(grapheme)).toBe(true)
    }
  })
})
