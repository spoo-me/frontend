import { describe, expect, it } from "vitest"

import { planFromSearch, stashSignupPlan, takeSignupPlan } from "./signup-plan"

function fakeStore() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  }
}

describe("signup plan stash", () => {
  it("reads only pro from the signup query", () => {
    expect(planFromSearch("?plan=pro")).toBe("pro")
    expect(planFromSearch("?plan=business")).toBeNull()
    expect(planFromSearch("")).toBeNull()
  })

  it("is consumed exactly once", () => {
    const store = fakeStore()
    stashSignupPlan("pro", store)
    expect(takeSignupPlan(store)).toBe("pro")
    expect(takeSignupPlan(store)).toBeNull()
  })

  it("stashes nothing for a plain signup", () => {
    const store = fakeStore()
    stashSignupPlan(null, store)
    expect(takeSignupPlan(store)).toBeNull()
  })

  it("fails closed when storage throws", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked")
      },
      setItem: () => {
        throw new Error("blocked")
      },
      removeItem: () => {},
    }
    stashSignupPlan("pro", broken)
    expect(takeSignupPlan(broken)).toBeNull()
  })
})
