import { NextResponse, type NextRequest } from "next/server"

/**
 * Cheap auth gate: the JWT pair lives in HttpOnly cookies set by the
 * backend (same host via the /auth proxy). We only check presence here —
 * signature/expiry validation stays server-side; the client handles
 * 401→refresh→retry. No cookie at all means definitely signed out.
 */
export function proxy(req: NextRequest) {
  const hasSession =
    req.cookies.has("access_token") || req.cookies.has("refresh_token")
  if (hasSession) return NextResponse.next()

  const login = new URL("/login", req.url)
  login.searchParams.set("next", req.nextUrl.pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
}
