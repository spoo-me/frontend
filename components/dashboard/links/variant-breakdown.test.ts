import { describe, expect, it } from "vitest"

import { variantSlots } from "./variant-breakdown"

const variants = [
  { url: "https://example.com/b", weight: 60 },
  { url: "https://example.com/c", weight: 30 },
]
const row = (value: string, clicks: number) => ({
  value,
  clicks,
  unique_clicks: clicks,
  percentage: 0,
})

describe("variantSlots", () => {
  it("joins configured variants with stats rows and adds the default", () => {
    const slots = variantSlots("https://example.com/", variants, [
      row("0", 118),
      row("(default)", 20),
    ])
    expect(slots.map((s) => [s.key, s.weight, s.clicks])).toEqual([
      ["0", 60, 118],
      ["1", 30, 0],
      ["(default)", 10, 20],
    ])
    expect(slots[2].url).toBe("https://example.com/")
  })

  it("keeps clicks stamped with a removed variant index", () => {
    const slots = variantSlots("https://example.com/", variants.slice(0, 1), [
      row("3", 7),
    ])
    expect(slots.at(-1)).toMatchObject({
      key: "3",
      url: null,
      weight: null,
      clicks: 7,
    })
  })
})
