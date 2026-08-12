import { describe, expect, it } from "vitest"

import { normalizeUrl, urlProblem } from "./validation"

/* Regression cover for the first-run destination field: onboarding must
   accept anything the composer accepts, normalizing bare domains instead of
   silently disabling submit. */

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

  it("rejects a subdomain of spoo.me", () => {
    expect(urlProblem("https://www.spoo.me/abc")).toBeTruthy()
  })

  /* The self-link guard is host-scoped, mirroring shared/validators.py.
     A foreign destination that merely mentions the name in its path or
     query is not a redirect loop — the substring check used to reject
     analytics dashboard URLs filtered on spoo.me. */
  it("accepts a foreign host that mentions spoo.me in the query", () => {
    expect(
      urlProblem("https://eu.posthog.com/project/220993/web?filter=spoo.me")
    ).toBeNull()
  })

  it("accepts a foreign host that mentions spoo.me in the path", () => {
    expect(urlProblem("https://example.com/spoo.me/guide")).toBeNull()
  })

  it("does not treat a lookalike host as self-referential", () => {
    expect(urlProblem("https://notspoo.me/abc")).toBeNull()
  })

  it("blocks spoo.me as the real host even behind userinfo", () => {
    expect(urlProblem("https://example.com@spoo.me/")).toBeTruthy()
  })
})
