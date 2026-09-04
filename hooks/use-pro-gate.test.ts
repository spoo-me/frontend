import { describe, expect, it } from "vitest"

import { blockedFeatures } from "./use-pro-gate"

describe("blockedFeatures", () => {
  const features = {
    geo_targeting: "locked",
    ab_variants: "enabled",
    custom_meta_tags: "hidden",
  } as const

  it("blocks locked features the draft uses, once each", () => {
    expect(
      blockedFeatures(features, [
        "geo_targeting",
        "geo_targeting",
        "ab_variants",
      ])
    ).toEqual(["geo_targeting"])
  })

  it("passes an empty draft", () => {
    expect(blockedFeatures(features, [])).toEqual([])
  })

  it("fails closed on unknown and missing states", () => {
    expect(blockedFeatures(features, ["custom_meta_tags"])).toEqual([
      "custom_meta_tags",
    ])
    expect(blockedFeatures(null, ["ab_variants"])).toEqual(["ab_variants"])
  })
})
