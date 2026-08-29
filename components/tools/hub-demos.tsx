import { MetaPreview } from "@/components/shared/meta-preview"
import { SPOO_MARK_MONO_DATA_URI } from "@/components/tools/qr-mark-mono"
import { DEFAULT_DESIGN, QR_BG_COLOR, QR_CENTER_LOGO } from "@/lib/qr/design"
import { qrSvgString } from "@/lib/qr/render"

/**
 * Static miniatures of each tool's real output for the hub cells — the
 * genuine renderers fed fixtures, never screenshots. All inert.
 */

export function UtmDemo() {
  return (
    <div className="w-full max-w-[260px] rounded-lg border border-border/60 bg-card p-3 font-mono text-[11px]">
      <div className="truncate text-muted-foreground">
        example.com/spring-launch
      </div>
      <div className="mt-2 space-y-1 border-border/40 border-t pt-2">
        {[
          ["utm_source", "newsletter"],
          ["utm_medium", "email"],
          ["utm_campaign", "spring-launch"],
        ].map(([key, value]) => (
          <div key={key} className="truncate">
            <span className="text-muted-foreground">{key}=</span>
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PreviewDemo() {
  return (
    <div className="w-full max-w-[250px]">
      <MetaPreview
        platform="x"
        title="spoo.me · open-source link management platform"
        description=""
        image="/og/home.jpg"
        domain="spoo.me"
      />
    </div>
  )
}

const DEMO_HOPS = [
  { status: "301", url: "bit.ly/3xK9zx" },
  { status: "302", url: "t.co/8fQm2A" },
  { status: "200", url: "example.com/article" },
]

export function ExpanderDemo() {
  return (
    <div className="w-full max-w-[250px] font-mono text-[11px]">
      {DEMO_HOPS.map((hop, i) => (
        <div
          key={hop.url}
          className="flex"
          style={{ marginLeft: i === 0 ? 0 : (i - 1) * 16 }}
        >
          {i > 0 && (
            <span
              aria-hidden
              className="-mt-1.5 mr-2 mb-[11px] ml-1 w-3 shrink-0 self-stretch rounded-bl-lg border-border/60 border-b border-l"
            />
          )}
          <div className="flex min-w-0 items-baseline gap-2 py-1">
            <span
              className={
                hop.status === "200"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {hop.status}
            </span>
            <span className="truncate text-foreground/90">{hop.url}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Rendered server-side — qrSvgString is a pure function. */
export function QrDemo() {
  const svg = qrSvgString({
    value: "https://spoo.me",
    size: 116,
    level: "H",
    bgColor: QR_BG_COLOR,
    fgColor: DEFAULT_DESIGN.fgColor,
    margin: 2,
    dotStyle: DEFAULT_DESIGN.dotStyle,
    markerBorderStyle: DEFAULT_DESIGN.markerBorderStyle,
    markerCenterStyle: DEFAULT_DESIGN.markerCenterStyle,
    imageSettings: {
      src: SPOO_MARK_MONO_DATA_URI,
      width: Math.round(116 * (QR_CENTER_LOGO?.scale ?? 0.26)),
      height: Math.round(116 * (QR_CENTER_LOGO?.scale ?? 0.26)),
      excavate: true,
    },
  })
  return (
    <div
      className="rounded-lg border border-border/60 bg-white p-2"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG built by our own renderer from a constant
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
