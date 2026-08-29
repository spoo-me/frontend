import { describe, expect, it } from "vitest"

import { contrastRatio, darkenUntilScannable, qrScanProblem } from "./contrast"
import {
  DEFAULT_DESIGN,
  FG_PRESETS,
  QR_BG_COLOR,
  getQrRenderProps,
  qrValue,
} from "./design"
import { qrSvgString } from "./render"

describe("qrValue", () => {
  it("appends the tracking param", () => {
    expect(qrValue("https://spoo.me/abc")).toBe("https://spoo.me/abc?qr=1")
  })

  it("chains onto an existing query string", () => {
    expect(qrValue("https://spoo.me/abc?x=1")).toBe(
      "https://spoo.me/abc?x=1&qr=1"
    )
  })
})

describe("getQrRenderProps", () => {
  const props = getQrRenderProps("https://spoo.me/abc", DEFAULT_DESIGN, {
    size: 1024,
    margin: 4,
  })

  it("encodes the tracked value at error level H with the mark excavated", () => {
    expect(props.value).toBe("https://spoo.me/abc?qr=1")
    expect(props.level).toBe("H")
    expect(props.imageSettings?.excavate).toBe(true)
  })

  it("keeps the mark within the error-correction budget", () => {
    expect(props.imageSettings!.width / props.size).toBeLessThanOrEqual(0.26)
  })
})

describe("qrSvgString", () => {
  const svg = qrSvgString(
    getQrRenderProps("https://spoo.me/abc", DEFAULT_DESIGN, {
      size: 1024,
      margin: 4,
    })
  )

  it("is a self-contained svg with the embedded mark", () => {
    expect(svg.startsWith("<svg xmlns=")).toBe(true)
    expect(svg).toContain('href="data:image/jpeg;base64,')
    expect(svg).not.toContain('href="http')
  })

  it("renders three finder patterns", () => {
    expect(svg.match(/fill-rule="evenodd"/g)).toHaveLength(3)
  })

  it("renders every dot style distinctly", () => {
    const at = (dotStyle: "square" | "rounded" | "extra-rounded") =>
      qrSvgString(
        getQrRenderProps(
          "https://spoo.me/abc",
          { ...DEFAULT_DESIGN, dotStyle },
          { size: 256, margin: 2 }
        )
      )
    const square = at("square")
    const rounded = at("rounded")
    const extra = at("extra-rounded")
    expect(square).not.toBe(rounded)
    expect(rounded).not.toBe(extra)
    expect(square).not.toBe(extra)
  })
})

describe("contrast guard", () => {
  it("passes every curated preset on the tile", () => {
    for (const fg of FG_PRESETS) {
      expect(qrScanProblem(fg, QR_BG_COLOR)).toBeNull()
    }
  })

  it("flags inverted codes", () => {
    expect(qrScanProblem("#ffffff", "#000000")).toBe("inverted")
  })

  it("flags low contrast", () => {
    expect(qrScanProblem("#e5e5e5", "#ffffff")).toBe("low_contrast")
  })

  it("darkens a failing color until it scans, keeping it a valid hex", () => {
    const fixed = darkenUntilScannable("#ffe0f0", "#ffffff")
    expect(fixed).toMatch(/^#[0-9A-F]{6}$/)
    expect(qrScanProblem(fixed, "#ffffff")).toBeNull()
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(4)
  })
})
