import { afterEach, describe, expect, it, vi } from "vitest"

import { apiFetch } from "./client"

/** Capture what apiFetch hands to the real fetch. */
function stubFetch() {
  const calls: { path: string; headers: Headers }[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      calls.push({ path, headers: new Headers(init?.headers) })
      return Promise.resolve(new Response(null, { status: 200 }))
    })
  )
  return calls
}

function stubPathname(pathname: string) {
  vi.stubGlobal("window", { location: { pathname } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("apiFetch — X-Spoo-Client attribution", () => {
  it("tags dashboard routes as dashboard", async () => {
    const calls = stubFetch()
    stubPathname("/dashboard/links")
    await apiFetch("/api/v1/urls", { method: "GET" })
    expect(calls[0].headers.get("X-Spoo-Client")).toBe("dashboard")
  })

  it("tags onboarding as the signed-in app too", async () => {
    const calls = stubFetch()
    stubPathname("/onboarding/recap")
    await apiFetch("/auth/onboarding", { method: "GET" })
    expect(calls[0].headers.get("X-Spoo-Client")).toBe("dashboard")
  })

  it("tags everything else as landing", async () => {
    const calls = stubFetch()
    for (const path of ["/", "/report", "/stats/abc", "/dashboardish"]) {
      stubPathname(path)
      await apiFetch("/api/v1/shorten", { method: "POST" })
    }
    for (const call of calls) {
      expect(call.headers.get("X-Spoo-Client")).toBe("landing")
    }
  })

  it("defaults to landing without a window (server-side public pages)", async () => {
    const calls = stubFetch()
    await apiFetch("http://localhost:8000/api/v1/public/preview/abc")
    expect(calls[0].headers.get("X-Spoo-Client")).toBe("landing")
  })

  it("keeps caller-provided headers intact", async () => {
    const calls = stubFetch()
    stubPathname("/")
    await apiFetch("/api/v1/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    expect(calls[0].headers.get("Content-Type")).toBe("application/json")
    expect(calls[0].headers.get("X-Spoo-Client")).toBe("landing")
  })
})
