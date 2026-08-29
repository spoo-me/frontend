/** WCAG relative luminance + the scan guard: phone cameras want a dark
    code on a light ground at 4:1 or better, or the scan silently fails. */

export const QR_MIN_CONTRAST = 4

function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function luminance(hex: string): number {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return 0
  const n = parseInt(m[1], 16)
  return (
    0.2126 * channel((n >> 16) & 0xff) +
    0.7152 * channel((n >> 8) & 0xff) +
    0.0722 * channel(n & 0xff)
  )
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export type ScanProblem = "inverted" | "low_contrast" | null

export function qrScanProblem(fg: string, bg: string): ScanProblem {
  if (luminance(fg) > luminance(bg)) return "inverted"
  if (contrastRatio(fg, bg) < QR_MIN_CONTRAST) return "low_contrast"
  return null
}

/** Walk lightness down (keeping hue) until the color scans. Always
    terminates: lightness 0 is black, which passes on any light ground. */
export function darkenUntilScannable(fg: string, bg: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(fg.trim())
  if (!m) return "#1B1B1F"
  let n = parseInt(m[1], 16)
  let r = (n >> 16) & 0xff
  let g = (n >> 8) & 0xff
  let b = n & 0xff
  const toHex = () =>
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  for (let i = 0; i < 40 && qrScanProblem(toHex(), bg) !== null; i++) {
    r = Math.floor(r * 0.92)
    g = Math.floor(g * 0.92)
    b = Math.floor(b * 0.92)
  }
  return toHex()
}
