import { describe, expect, it } from "vitest"

import { normalizeUrl, urlProblem } from "./validation"

/* Regression cover for the first-run destination field, which used to gate
   submit on a bare /^https?:\/\// regex. A pasted "google.com" left the
   button disabled with nothing on screen explaining why, so people skipped
   the step. Onboarding now normalizes exactly like the composer does. */

describe("normalizeUrl", () => {
  it("adds https to a bare domain", () => {
    expect(normalizeUrl("google.com")).toBe("https://google.com")
  })

  it("keeps a path and query intact while adding the scheme", () => {
    expect(normalizeUrl("www.google.com/a/b?x=1")).toBe(
      "https://www.google.com/a/b?x=1"
    )
  })

  it("leaves an explicit scheme alone, including http", () => {
    expect(normalizeUrl("http://plain.com")).toBe("http://plain.com")
    expect(normalizeUrl("https://ok.com/p")).toBe("https://ok.com/p")
  })

  it("passes an empty value straight through", () => {
    expect(normalizeUrl("   ")).toBe("")
  })
})

describe("urlProblem", () => {
  it("does not object to a scheme-less URL", () => {
    expect(urlProblem("google.com")).toBeNull()
    expect(urlProblem("www.google.com/a/b?x=1")).toBeNull()
  })

  it("names the problem for input that cannot be salvaged", () => {
    // Each must return copy, not just a falsy "invalid" — the whole point is
    // that the user is told which of these they hit.
    expect(urlProblem("has space.com")).toBeTruthy()
    expect(urlProblem("example")).toBeTruthy()
  })

  it("rejects short links pointing back at spoo.me", () => {
    expect(urlProblem("spoo.me/abc")).toBeTruthy()
  })
})
