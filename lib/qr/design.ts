import { SPOO_MARK_DATA_URI } from "./logo"
import type {
  DotStyle,
  MarkerBorderStyle,
  MarkerCenterStyle,
  QrDesign,
  QrRenderProps,
} from "./types"

export const DOT_STYLES: DotStyle[] = ["square", "rounded", "extra-rounded"]
export const MARKER_BORDER_STYLES: MarkerBorderStyle[] = [
  "square",
  "rounded-square",
  "circle",
]
export const MARKER_CENTER_STYLES: MarkerCenterStyle[] = ["square", "circle"]

/** All presets clear the 4:1 scan-contrast floor on the white tile. */
export const FG_PRESETS = [
  "#1B1B1F",
  "#000000",
  "#6D28D9",
  "#1E40AF",
  "#166534",
  "#B91C1C",
] as const

/** The qr.spoo.me look: near-black ink, round dots, rounded eyes. */
export const DEFAULT_DESIGN: QrDesign = {
  v: 1,
  fgColor: "#1B1B1F",
  dotStyle: "rounded",
  markerBorderStyle: "rounded-square",
  markerCenterStyle: "circle",
}

/** Fixed non-choices: the tile stays light (scannability floor) and the
    center always carries the spoo mark; user logo control is a later,
    paid feature. The COLOR ghost, deliberately: the ink silhouette has no
    interior detail and reads as a smudge at code scale. */
export const QR_BG_COLOR = "#ffffff"
// 0.26 compensates for the white pad baked into the asset; the excavated
// area stays ~7% of the code, well inside level H's 30% budget.
export const QR_CENTER_LOGO: { src: string; scale: number } | null = {
  src: SPOO_MARK_DATA_URI,
  scale: 0.26,
}

export const QR_STORAGE_KEY = "spoo.qr_design.v1"
export const QR_DESIGN_CHANGED = "spoo:qr-design-changed"

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | null {
  return allowed.includes(value as T) ? (value as T) : null
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function readQrDesign(): QrDesign {
  if (typeof window === "undefined") return DEFAULT_DESIGN
  try {
    const raw = window.localStorage.getItem(QR_STORAGE_KEY)
    if (!raw) return DEFAULT_DESIGN
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_DESIGN
    const p = parsed as Partial<QrDesign>
    return {
      v: 1,
      fgColor:
        typeof p.fgColor === "string" && HEX_RE.test(p.fgColor)
          ? p.fgColor
          : DEFAULT_DESIGN.fgColor,
      dotStyle: oneOf(p.dotStyle, DOT_STYLES) ?? DEFAULT_DESIGN.dotStyle,
      markerBorderStyle:
        oneOf(p.markerBorderStyle, MARKER_BORDER_STYLES) ??
        DEFAULT_DESIGN.markerBorderStyle,
      markerCenterStyle:
        oneOf(p.markerCenterStyle, MARKER_CENTER_STYLES) ??
        DEFAULT_DESIGN.markerCenterStyle,
    }
  } catch {
    return DEFAULT_DESIGN
  }
}

export function writeQrDesign(design: QrDesign) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(design))
    window.dispatchEvent(new Event(QR_DESIGN_CHANGED))
  } catch {
    /* storage blocked — the design just won't persist */
  }
}

export function onQrDesignChanged(cb: () => void) {
  window.addEventListener(QR_DESIGN_CHANGED, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(QR_DESIGN_CHANGED, cb)
    window.removeEventListener("storage", cb)
  }
}

/** The scan-tracking contract: the encoded URL carries qr=1, which the
    redirect strips and records as trigger=qr. Built here and only here. */
export function qrValue(shortUrl: string): string {
  return `${shortUrl}${shortUrl.includes("?") ? "&" : "?"}qr=1`
}

export function getQrRenderProps(
  shortUrl: string,
  design: QrDesign,
  opts: { size: number; margin: number }
): QrRenderProps {
  return {
    value: qrValue(shortUrl),
    size: opts.size,
    // H whenever the mark occupies the center, so the excavated modules
    // stay within the error-correction budget.
    level: QR_CENTER_LOGO ? "H" : "Q",
    bgColor: QR_BG_COLOR,
    fgColor: design.fgColor,
    margin: opts.margin,
    dotStyle: design.dotStyle,
    markerBorderStyle: design.markerBorderStyle,
    markerCenterStyle: design.markerCenterStyle,
    markerColor: design.markerColor,
    ...(QR_CENTER_LOGO && {
      imageSettings: {
        src: QR_CENTER_LOGO.src,
        width: Math.round(opts.size * QR_CENTER_LOGO.scale),
        height: Math.round(opts.size * QR_CENTER_LOGO.scale),
        excavate: true,
      },
    }),
  }
}
