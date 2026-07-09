import { NextRequest, NextResponse } from "next/server"

/**
 * Favicon proxy. gstatic's faviconV2 signals "no favicon" with a 404 that
 * still carries a decodable 16px globe PNG, so a browser <img> fires onload
 * and the blurry globe renders. It also sends no CORS headers, so the
 * client can't check the status itself. This route passes real icons
 * through and turns the globe-404 into a bodyless 404 that makes <img>
 * onError fire, letting the UI draw its own fallback glyph.
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain") ?? ""
  const size = Number(req.nextUrl.searchParams.get("size") ?? 64)
  if (!/^[a-z0-9.-]{1,253}$/i.test(domain) || ![32, 64, 128].includes(size))
    return new NextResponse(null, { status: 400 })

  const upstream = await fetch(
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE&url=https://${encodeURIComponent(domain)}&size=${size}`,
    { headers: { Accept: "image/*" } },
  )
  if (!upstream.ok || !upstream.body)
    return new NextResponse(null, { status: 404 })

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  })
}
