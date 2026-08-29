import { getQrRenderProps } from "./design"
import { qrSvgString } from "./render"
import type { QrDesign } from "./types"

export type QrExportFormat = "svg" | "png" | "jpeg"

// Exports bake the full 4-module quiet zone into the artwork itself, so a
// pasted file scans without the recipient knowing to add padding.
const EXPORT_SIZE = 1024
const EXPORT_MARGIN = 4

function exportSvgString(shortUrl: string, design: QrDesign): string {
  return qrSvgString(
    getQrRenderProps(shortUrl, design, {
      size: EXPORT_SIZE,
      margin: EXPORT_MARGIN,
    })
  )
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function rasterize(
  svg: string,
  mime: "image/png" | "image/jpeg"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = EXPORT_SIZE
      canvas.height = EXPORT_SIZE
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("canvas unavailable"))
      // JPEG has no alpha; painting white first keeps both formats identical.
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)
      ctx.drawImage(img, 0, 0, EXPORT_SIZE, EXPORT_SIZE)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
        mime,
        0.92
      )
    }
    img.onerror = () => reject(new Error("svg rasterization failed"))
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
  })
}

function filenameFor(alias: string, ext: QrExportFormat): string {
  return `spoo-${alias.replace(/[/\\]/g, "_")}.${ext === "jpeg" ? "jpg" : ext}`
}

export async function downloadQr(
  shortUrl: string,
  alias: string,
  design: QrDesign,
  format: QrExportFormat
): Promise<void> {
  const svg = exportSvgString(shortUrl, design)
  if (format === "svg") {
    saveBlob(
      new Blob([svg], { type: "image/svg+xml" }),
      filenameFor(alias, "svg")
    )
    return
  }
  const blob = await rasterize(
    svg,
    format === "png" ? "image/png" : "image/jpeg"
  )
  saveBlob(blob, filenameFor(alias, format))
}

export function canCopyImage(): boolean {
  return (
    typeof ClipboardItem !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.clipboard?.write
  )
}

/** Must be called synchronously inside the click handler: Safari burns the
    user gesture after an await, so the ClipboardItem wraps the pending blob. */
export function copyQrPng(shortUrl: string, design: QrDesign): Promise<void> {
  const svg = exportSvgString(shortUrl, design)
  return navigator.clipboard.write([
    new ClipboardItem({ "image/png": rasterize(svg, "image/png") }),
  ])
}
