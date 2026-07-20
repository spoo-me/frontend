import { NextResponse, type NextRequest } from "next/server"

/**
 * Cheap auth gate: the JWT pair lives in HttpOnly cookies set by the
 * backend (same host via the /auth proxy). We only check presence here —
 * signature/expiry validation stays server-side; the client handles
 * 401→refresh→retry. No cookie at all means definitely signed out.
 *
 * The root swap (signed-in `/` → /dashboard) relies on this middleware
 * actually running per-request: `/` must never be edge-cached as HTML,
 * or anonymous visitors could be served a cached 307.
 */
export function proxy(req: NextRequest) {
  const hasSession =
    req.cookies.has("access_token") || req.cookies.has("refresh_token")

  if (req.nextUrl.pathname === "/") {
    return hasSession
      ? NextResponse.redirect(new URL("/dashboard", req.url))
      : NextResponse.next()
  }

  if (hasSession) return NextResponse.next()

  const login = new URL("/login", req.url)
  login.searchParams.set("next", req.nextUrl.pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/onboarding/:path*"],
}
