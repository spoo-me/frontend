import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { proxy } from "./proxy"

function request(path: string, cookie?: string) {
  return new NextRequest(`https://spoo.me${path}`, {
    headers: cookie ? { cookie } : undefined,
  })
}

/** NextResponse.next() marks pass-through with this header. */
function passesThrough(res: Response) {
  return res.headers.get("x-middleware-next") === "1"
}

describe("proxy", () => {
  it("lets a signed-out visitor see the landing page", () => {
    const res = proxy(request("/"))
    expect(passesThrough(res)).toBe(true)
  })

  it("sends a signed-in visitor from / to the dashboard", () => {
    const res = proxy(request("/", "access_token=x"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("https://spoo.me/dashboard")
  })

  it("treats a refresh-only cookie as a session", () => {
    const res = proxy(request("/", "refresh_token=x"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("https://spoo.me/dashboard")
  })

  it("bounces a signed-out visitor off the dashboard, preserving next", () => {
    const res = proxy(request("/dashboard/links"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe(
      "https://spoo.me/login?next=%2Fdashboard%2Flinks"
    )
  })

  it("lets a signed-in visitor into the dashboard", () => {
    const res = proxy(request("/dashboard", "access_token=x"))
    expect(passesThrough(res)).toBe(true)
  })
})
