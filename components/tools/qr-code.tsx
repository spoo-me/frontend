"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Link2,
  Loader2,
} from "lucide-react"
import { HexColorPicker } from "react-colorful"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { darkenUntilScannable, qrScanProblem } from "@/lib/qr/contrast"
import {
  DEFAULT_DESIGN,
  DOT_STYLES,
  FG_PRESETS,
  QR_BG_COLOR,
  QR_CENTER_LOGO,
  qrValue,
  readQrDesign,
  writeQrDesign,
} from "@/lib/qr/design"
import { qrSvgString } from "@/lib/qr/render"
import type { QrDesign, QrRenderProps } from "@/lib/qr/types"
import { SPOO_MARK_MONO_DATA_URI } from "@/components/tools/qr-mark-mono"
import { trackToolAction } from "@/lib/analytics"
import { shorten, SpooApiError } from "@/lib/api"
import { normalizeUrl } from "@/lib/validation"

const DOT_LABELS: Record<(typeof DOT_STYLES)[number], string> = {
  square: "square",
  rounded: "rounded",
  "extra-rounded": "round",
}

/* lib/qr's own prop builder appends ?qr=1 (the scan-tracking contract for
   spoo links). This tool also encodes foreign URLs, which must ride
   verbatim — nobody wants a tool that edits their link — so the props are
   assembled here and qr=1 is added only once the URL is a spoo one. */
function toolRenderProps(
  value: string,
  design: QrDesign,
  opts: { size: number; margin: number }
): QrRenderProps {
  return {
    value,
    size: opts.size,
    level: "H",
    bgColor: QR_BG_COLOR,
    fgColor: design.fgColor,
    margin: opts.margin,
    dotStyle: design.dotStyle,
    markerBorderStyle: design.markerBorderStyle,
    markerCenterStyle: design.markerCenterStyle,
    markerColor: design.markerColor,
    imageSettings: {
      src: SPOO_MARK_MONO_DATA_URI,
      width: Math.round(opts.size * (QR_CENTER_LOGO?.scale ?? 0.26)),
      height: Math.round(opts.size * (QR_CENTER_LOGO?.scale ?? 0.26)),
      excavate: true,
    },
  }
}

/* Exports bake the full quiet zone in, same numbers as lib/qr/download.ts
   (which is not reusable here — it hardwires the qr=1 contract). */
const EXPORT_SIZE = 1024
const EXPORT_MARGIN = 4

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function rasterizePng(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = EXPORT_SIZE
      canvas.height = EXPORT_SIZE
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("canvas unavailable"))
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)
      ctx.drawImage(img, 0, 0, EXPORT_SIZE, EXPORT_SIZE)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
        "image/png"
      )
    }
    img.onerror = () => reject(new Error("svg rasterization failed"))
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
  })
}

export function QrGenerator() {
  const [raw, setRaw] = React.useState("")
  const [design, setDesign] = React.useState<QrDesign>(DEFAULT_DESIGN)
  const [canCopy, setCanCopy] = React.useState(false)
  const [imgCopied, setImgCopied] = React.useState(false)
  const [short, setShort] = React.useState<{
    url: string
    code: string
  } | null>(null)
  const [shortening, setShortening] = React.useState(false)
  const [shortError, setShortError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  // Same persisted design the product's QR surfaces read — restored after
  // hydration so the SSR markup stays deterministic.
  React.useEffect(() => {
    setDesign(readQrDesign())
    setCanCopy(
      typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write
    )
  }, [])

  function updateDesign(patch: Partial<QrDesign>) {
    setDesign((d) => {
      const next = { ...d, ...patch }
      writeQrDesign(next)
      return next
    })
  }

  const isCustomColor = !(FG_PRESETS as readonly string[]).includes(
    design.fgColor
  )
  const scanProblem = qrScanProblem(design.fgColor, QR_BG_COLOR)

  // Spoo short links carry ?qr=1 so scans land as trigger=qr; foreign
  // URLs are encoded exactly as given.
  const value = short ? qrValue(short.url) : raw.trim() ? normalizeUrl(raw) : ""

  const svg = React.useMemo(
    () =>
      value
        ? qrSvgString(toolRenderProps(value, design, { size: 256, margin: 2 }))
        : null,
    [value, design]
  )

  function exportSvgString(): string {
    return qrSvgString(
      toolRenderProps(value, design, {
        size: EXPORT_SIZE,
        margin: EXPORT_MARGIN,
      })
    )
  }

  function download(format: "png" | "svg") {
    if (!value) return
    const exportSvg = exportSvgString()
    const name = `spoo-qr-${short?.code ?? "code"}.${format}`
    if (format === "svg") {
      saveBlob(new Blob([exportSvg], { type: "image/svg+xml" }), name)
    } else {
      rasterizePng(exportSvg).then((blob) => saveBlob(blob, name))
    }
    trackToolAction("qr-code", "downloaded", format)
  }

  /* ClipboardItem wraps the pending blob synchronously — Safari burns the
     user gesture after an await. */
  function copyImage() {
    if (!value) return
    navigator.clipboard
      .write([
        new ClipboardItem({ "image/png": rasterizePng(exportSvgString()) }),
      ])
      .then(() => {
        setImgCopied(true)
        setTimeout(() => setImgCopied(false), 1600)
        trackToolAction("qr-code", "copied", "image")
      })
      .catch(() => undefined)
  }

  async function onShorten() {
    if (!value || short) return
    setShortening(true)
    setShortError(null)
    try {
      const link = await shorten({ long_url: value })
      trackToolAction("qr-code", "shortened")
      setShort({ url: link.short_url, code: link.alias })
    } catch (err) {
      setShortError(
        err instanceof SpooApiError && err.field === "long_url"
          ? err.message
          : "Couldn't shorten that just now. The QR above still works."
      )
    } finally {
      setShortening(false)
    }
  }

  async function copyShort() {
    if (!short) return
    try {
      await navigator.clipboard.writeText(short.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt("Copy:", short.url)
    }
  }

  return (
    <div>
      <div className="w-full rounded-xl border border-border/60 bg-background/45 shadow-soft backdrop-blur-md dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex h-14 items-center gap-3 px-5 py-2">
          <Link2 className="size-4 shrink-0 text-muted-foreground" />
          <Input
            type="url"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value)
              setShort(null)
              setShortError(null)
            }}
            placeholder="Paste the link to encode…"
            className="h-full rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:shadow-none"
            autoComplete="off"
            // biome-ignore lint/a11y/noAutofocus: the input IS the page
            autoFocus
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {svg && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 rounded-xl border border-border/60 bg-card p-6 sm:p-8"
          >
            <div className="flex flex-col items-center gap-6">
              <div
                className="rounded-xl border border-border/60 bg-white p-3 [&_svg]:size-60 sm:[&_svg]:size-64"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG built locally by our own renderer
                dangerouslySetInnerHTML={{ __html: svg }}
              />

              <div className="flex flex-col items-center gap-3 lg:flex-row lg:gap-6">
                <div className="flex items-center gap-2.5">
                  {FG_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Ink ${hex}`}
                      title={hex}
                      onClick={() => updateDesign({ fgColor: hex })}
                      className={cn(
                        "size-5 rounded-full border border-border/60 transition-transform duration-150 hover:scale-110",
                        design.fgColor === hex &&
                          "ring-1 ring-foreground/60 ring-offset-2 ring-offset-card"
                      )}
                      style={{ background: hex }}
                    />
                  ))}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label="Custom color"
                        title="Custom color"
                        className={cn(
                          "size-5 rounded-full border border-border/60 transition-transform duration-150 hover:scale-110",
                          isCustomColor &&
                            "ring-1 ring-foreground/60 ring-offset-2 ring-offset-card"
                        )}
                        style={{
                          background: isCustomColor
                            ? design.fgColor
                            : "conic-gradient(from 0deg, #f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7, #f43f5e)",
                        }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" sideOffset={8}>
                      <HexColorPicker
                        color={design.fgColor}
                        onChange={(hex) =>
                          updateDesign({ fgColor: hex.toUpperCase() })
                        }
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          value={design.fgColor}
                          onChange={(e) => {
                            const v = e.target.value.trim()
                            if (/^#[0-9a-fA-F]{6}$/.test(v))
                              updateDesign({ fgColor: v.toUpperCase() })
                          }}
                          className="h-8 font-mono text-xs"
                        />
                      </div>
                      {scanProblem && (
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <p className="font-mono text-[11px] text-destructive">
                            {scanProblem === "inverted"
                              ? "too light; scanners want dark on light"
                              : "under 4:1 contrast; may not scan"}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 font-mono text-[11px]"
                            onClick={() =>
                              updateDesign({
                                fgColor: darkenUntilScannable(
                                  design.fgColor,
                                  QR_BG_COLOR
                                ),
                              })
                            }
                          >
                            darken
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-1">
                  {DOT_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => updateDesign({ dotStyle: style })}
                      className={cn(
                        "rounded-md px-2 py-1 font-mono text-[11px] transition-colors duration-150",
                        design.dotStyle === style
                          ? "bg-muted/60 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {DOT_LABELS[style]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Download className="size-3.5" data-icon="inline-start" />
                      Download
                      <ChevronDown
                        className="size-3.5"
                        data-icon="inline-end"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => download("png")}>
                      PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => download("svg")}>
                      SVG
                    </DropdownMenuItem>
                    {canCopy && (
                      <DropdownMenuItem onClick={copyImage}>
                        {imgCopied ? "Copied" : "Copy image"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                {short ? (
                  <div className="flex items-center gap-1">
                    <a
                      href={short.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium font-mono text-foreground text-sm hover:text-foreground/80"
                    >
                      {short.url.replace(/^https?:\/\//, "")}
                    </a>
                    <Button
                      onClick={copyShort}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground hover:text-foreground"
                    >
                      {copied ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={onShorten}
                    disabled={shortening}
                    size="sm"
                    variant="outline"
                  >
                    {shortening ? (
                      <>
                        <Loader2
                          className="size-3.5 animate-spin"
                          data-icon="inline-start"
                        />
                        Shortening
                      </>
                    ) : (
                      "Shorten & track scans"
                    )}
                  </Button>
                )}
              </div>
              {short && (
                <p className="-mt-3 text-muted-foreground text-xs">
                  The QR now encodes your short link, so every scan is counted
                  on the link's stats page.
                </p>
              )}
              {shortError && (
                <p className="-mt-3 text-destructive text-xs">{shortError}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
