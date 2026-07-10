"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, ArrowUpRight, Check, Copy, Download, QrCode } from "lucide-react"
import { BaseQr, encodeData } from "simple-qrbtf"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { celebrate } from "@/lib/confetti"
import { trackLinkCreated } from "@/lib/analytics"
import {
  checkAlias,
  shorten,
  SpooApiError,
  type ShortenInput,
  type ShortUrl,
} from "@/lib/api"

type AliasState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "unavailable"; reason: string }

export function LinkStep({
  onDone,
  onSkip,
}: {
  onDone: (link: ShortUrl) => void
  onSkip: () => void
}) {
  const [url, setUrl] = React.useState("")
  const [alias, setAlias] = React.useState("")
  const [aliasState, setAliasState] = React.useState<AliasState>({ kind: "idle" })
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [created, setCreated] = React.useState<ShortUrl | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [qrOpen, setQrOpen] = React.useState(false)
  const linkRef = React.useRef<HTMLDivElement>(null)

  const urlLooksValid = /^https?:\/\/\S+\.\S+/.test(url.trim())

  // Debounced live alias availability — same affordance as the legacy
  // create modal, against the real check-alias endpoint.
  React.useEffect(() => {
    if (!alias) {
      setAliasState({ kind: "idle" })
      return
    }
    if (alias.length < 3) {
      setAliasState({ kind: "unavailable", reason: "3+ characters" })
      return
    }
    setAliasState({ kind: "checking" })
    const t = setTimeout(() => {
      checkAlias(alias)
        .then((r) =>
          setAliasState(
            r.available
              ? { kind: "available" }
              : {
                  kind: "unavailable",
                  reason: r.reason === "taken" ? "already taken" : "invalid format",
                },
          ),
        )
        .catch(() => setAliasState({ kind: "idle" }))
    }, 350)
    return () => clearTimeout(t)
  }, [alias])

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!urlLooksValid || pending || created) return
    if (alias && aliasState.kind === "unavailable") return
    setPending(true)
    setError(null)
    try {
      const input: ShortenInput = {
        long_url: url.trim(),
        ...(alias ? { alias } : {}),
      }
      const link = await shorten(input)
      trackLinkCreated(input, "onboarding")
      setCreated(link)
    } catch (err) {
      if (err instanceof SpooApiError && err.status === 409) {
        setError("That alias just got taken. Try another.")
        setAliasState({ kind: "unavailable", reason: "already taken" })
      } else if (err instanceof SpooApiError && err.needsVerification) {
        setError("Your email needs to be verified before creating links.")
      } else if (err instanceof SpooApiError) {
        setError(err.message)
      } else {
        setError("Can't reach the server. Try again in a moment.")
      }
    } finally {
      setPending(false)
    }
  }

  // One celebratory burst when the link lands, sourced from the link itself.
  React.useEffect(() => {
    if (!created) return
    const t = setTimeout(() => celebrate(linkRef.current), 120)
    return () => clearTimeout(t)
  }, [created])

  // After creation: Enter advances — unless the QR dialog owns focus.
  React.useEffect(() => {
    if (!created || qrOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        onDone(created!)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [created, qrOpen, onDone])

  async function copy() {
    if (!created) return
    await navigator.clipboard.writeText(created.short_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {created ? "Your first link is live" : "Create your first link"}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        {created
          ? "Share it anywhere. Every click lands in your analytics."
          : "Paste any long URL you actually use. We'll make it short."}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {created ? (
          <motion.div
            key="created"
            initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-12 flex w-full max-w-md flex-col items-center"
          >
            <LinkResult created={created} linkRef={linkRef} />

            <div className="mt-7 flex items-center justify-center gap-2">
              <Button onClick={() => void copy()} size="sm" variant="outline">
                {copied ? (
                  <>
                    <Check className="text-live size-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy link
                  </>
                )}
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={created.short_url} target="_blank" rel="noreferrer">
                  Open
                  <ArrowUpRight className="size-3.5" />
                </a>
              </Button>
              <Button onClick={() => setQrOpen(true)} size="sm" variant="outline">
                <QrCode className="size-3.5" />
                QR code
              </Button>
            </div>

            <Button onClick={() => onDone(created)} className="mt-12 h-10 min-w-44">
              Continue
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-10 w-full max-w-md space-y-3 text-left"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ob-url" className="text-foreground text-sm font-medium">
                Destination URL
              </label>
              <Input
                id="ob-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/very/long/path?with=params"
                autoFocus
                required
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="ob-alias" className="text-foreground text-sm font-medium">
                  Custom alias
                </label>
                <span className="text-muted-foreground/70 text-xs">optional</span>
              </div>
              <div className="border-input focus-within:border-ring focus-within:ring-ring/30 shadow-soft flex items-center rounded-lg border transition-[box-shadow,border-color] focus-within:ring-2">
                <span className="text-muted-foreground border-border/60 border-r px-3 font-mono text-sm">
                  spoo.me/
                </span>
                <input
                  id="ob-alias"
                  value={alias}
                  onChange={(e) =>
                    setAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16))
                  }
                  placeholder="launch"
                  className="placeholder:text-muted-foreground/50 h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none"
                />
                <span className="pr-3">
                  <AliasBadge state={aliasState} />
                </span>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="mt-2 h-10 w-full"
              disabled={
                pending ||
                !urlLooksValid ||
                (alias.length > 0 && aliasState.kind !== "available")
              }
            >
              {pending ? "Shortening…" : "Shorten it"}
              {!pending && <ArrowRight className="size-4" data-icon="inline-end" />}
            </Button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-muted-foreground/70 hover:text-foreground text-xs underline-offset-4 transition-colors hover:underline"
              >
                I&apos;ll do this later
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {created && (
        <QrDialog open={qrOpen} onOpenChange={setQrOpen} created={created} />
      )}
    </div>
  )
}

/* The hero: short link floated on the page (no panel), destination below. */
function LinkResult({
  created,
  linkRef,
}: {
  created: ShortUrl
  linkRef: React.RefObject<HTMLDivElement | null>
}) {
  const noProto = created.short_url.replace(/^https?:\/\//, "")
  const slash = noProto.indexOf("/")
  const host = slash >= 0 ? noProto.slice(0, slash + 1) : `${noProto}/`
  const slug = slash >= 0 ? noProto.slice(slash + 1) : created.alias

  let destHost = created.long_url
  try {
    destHost = new URL(created.long_url).hostname.replace(/^www\./, "")
  } catch {
    /* keep raw */
  }

  return (
    <div ref={linkRef} className="flex flex-col items-center gap-3">
      <div className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
        <span className="text-muted-foreground/45">{host}</span>
        <span className="text-foreground">{slug}</span>
      </div>
      <div className="text-muted-foreground/70 flex items-center gap-1.5 text-xs">
        <span aria-hidden>↳</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${destHost}&sz=64`}
          alt=""
          className="size-3.5 rounded-[3px]"
          loading="lazy"
        />
        <span className="max-w-[16rem] truncate">{destHost}</span>
      </div>
    </div>
  )
}

function AliasBadge({ state }: { state: AliasState }) {
  if (state.kind === "idle") return null
  return (
    <span
      className={cn(
        "label-mono text-[9px] whitespace-nowrap",
        state.kind === "available" && "text-live",
        state.kind === "checking" && "text-muted-foreground/60",
        state.kind === "unavailable" && "text-destructive",
      )}
      aria-live="polite"
    >
      {state.kind === "checking"
        ? "checking…"
        : state.kind === "available"
          ? "available"
          : state.reason}
    </span>
  )
}

/* Scannable QR (dark-on-white) in a bright tile, downloadable as PNG. */
function QrDialog({
  open,
  onOpenChange,
  created,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  created: ShortUrl
}) {
  const tileRef = React.useRef<HTMLDivElement>(null)
  const svg = React.useMemo(() => {
    const data = encodeData({ text: created.short_url })
    return BaseQr({ qrcode: data, otherColor: "#0a0a0a", posColor: "#0a0a0a" })
  }, [created.short_url])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Darker than the default popover grey; no close X (backdrop + Esc
          dismiss); generous padding; no separate footer band. */}
      <DialogContent
        showCloseButton={false}
        className="bg-background gap-5 p-7 text-center sm:max-w-xs"
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-lg">QR code</DialogTitle>
          <DialogDescription>Scan it, or download to share.</DialogDescription>
        </DialogHeader>

        <div
          ref={tileRef}
          className="justify-self-center rounded-2xl bg-white p-2.5 ring-1 ring-foreground/10"
        >
          {/* Crop most of the QR's built-in quiet zone for a tighter look;
              the downloaded PNG re-serializes the full-margin svg. */}
          <div
            role="img"
            aria-label={`QR code for ${created.short_url}`}
            className="size-40 overflow-hidden [&_svg]:size-full [&_svg]:scale-[1.16]"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        <Button
          onClick={() => downloadQrPng(tileRef.current, `spoo-${created.alias}.png`)}
          size="sm"
          className="justify-self-center"
        >
          <Download className="size-3.5" />
          Download PNG
        </Button>
      </DialogContent>
    </Dialog>
  )
}

/* Rasterize the inline QR svg to a padded 1024px PNG on white. */
function downloadQrPng(container: HTMLElement | null, filename: string) {
  const source = container?.querySelector("svg")
  if (!source) return
  const clone = source.cloneNode(true) as SVGSVGElement
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  const SIZE = 1024
  const PAD = Math.round(SIZE * 0.08)
  clone.setAttribute("width", String(SIZE))
  clone.setAttribute("height", String(SIZE))
  const xml = new XMLSerializer().serializeToString(clone)

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement("canvas")
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.drawImage(img, PAD, PAD, SIZE - PAD * 2, SIZE - PAD * 2)
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = filename
    a.click()
  }
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml)
}
