import { readFile } from "node:fs/promises"
import path from "node:path"

import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "spoo.me link statistics"

/* Aliases are user content: emoji and word codes render; anything longer
   than the frame allows is clamped so the card never overflows. */
function displayCode(raw: string): string {
  const code = decodeURIComponent(raw)
  return code.length > 18 ? `${code.slice(0, 18)}…` : code
}

// node:fs read + outputFileTracingIncludes (next.config) so the assets
// travel into the standalone build; bundler asset URLs don't cover them.
const asset = (rel: string) =>
  readFile(path.join(process.cwd(), "design/og-cards", rel)).then(
    (b) =>
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
  )

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const [bg, geist, serif, mono] = await Promise.all([
    asset("assets/stats-bg.png"),
    asset("fonts/geist-600.ttf"),
    asset("fonts/instrument-serif-italic.ttf"),
    asset("fonts/geist-mono-500.ttf"),
  ])
  const bgSrc = `data:image/png;base64,${Buffer.from(bg).toString("base64")}`

  return new ImageResponse(
    <div style={{ display: "flex", width: 1200, height: 630 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgSrc}
        alt=""
        width={1200}
        height={630}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          position: "absolute",
          left: 84,
          bottom: 84,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontFamily: "Geist",
            fontSize: 72,
            letterSpacing: "-0.028em",
            color: "#fafafa",
          }}
        >
          <span>Link stats for</span>
          <span
            style={{
              display: "flex",
              fontFamily: "GeistMono",
              fontSize: 58,
              color: "#fafafa",
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.14)",
              borderRadius: 14,
              padding: "2px 20px 8px",
            }}
          >
            /{displayCode(code)}
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: "InstrumentSerif",
            fontStyle: "italic",
            fontSize: 72,
            color: "rgba(255,255,255,.62)",
          }}
        >
          clicks, countries, referrers, devices.
        </div>
      </div>
    </div>,
    {
      ...size,
      emoji: "twemoji",
      fonts: [
        { name: "Geist", data: geist, weight: 600 },
        { name: "GeistMono", data: mono, weight: 500 },
        {
          name: "InstrumentSerif",
          data: serif,
          weight: 400,
          style: "italic",
        },
      ],
    }
  )
}
