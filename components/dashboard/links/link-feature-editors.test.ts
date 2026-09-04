import { describe, expect, it } from "vitest"

import {
  enteredWeightTotal,
  evenSplitVariants,
  type VariantDraft,
} from "./link-feature-editors"

const draft = (url: string, weight: string): VariantDraft => ({ url, weight })

describe("evenSplitVariants", () => {
  it("gives a single variant the full 100%", () => {
    expect(evenSplitVariants([draft("", "")])).toEqual([draft("", "100")])
  })

  it("splits two variants evenly", () => {
    const result = evenSplitVariants([draft("a", "40"), draft("", "")])
    expect(result.map((v) => v.weight)).toEqual(["50", "50"])
  })

  it("puts the remainder on the earliest variants", () => {
    const result = evenSplitVariants([
      draft("a", ""),
      draft("b", ""),
      draft("c", ""),
    ])
    expect(result.map((v) => v.weight)).toEqual(["34", "33", "33"])
  })

  it("preserves urls while rewriting weights", () => {
    const result = evenSplitVariants([draft("https://a.example/", "60")])
    expect(result[0].url).toBe("https://a.example/")
  })

  it("is a no-op on an empty list", () => {
    expect(evenSplitVariants([])).toEqual([])
  })
})

describe("enteredWeightTotal", () => {
  it("counts a row's weight even before it has a url", () => {
    // Add-variant rebalances every row's weight immediately; the new
    // row's url is still blank at that point.
    const total = enteredWeightTotal([
      draft("https://a.example/", "34"),
      draft("", "33"),
      draft("", "33"),
    ])
    expect(total).toBe(100)
  })

  it("ignores blank or zero weights", () => {
    expect(enteredWeightTotal([draft("a", ""), draft("b", "0")])).toBe(0)
  })
})
