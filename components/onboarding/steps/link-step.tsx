"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  QrCode,
} from "lucide-react"
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
import { trackLinkCreated, trackUiAction } from "@/lib/analytics"
import {
  shorten,
  SpooApiError,
  type CheckAliasReason,
  type ShortenInput,
  type ShortUrl,
} from "@/lib/api"
import { findUnsupportedGraphemes, isEmojiCandidate } from "@/lib/emoji-alias"
import { useAliasCheck } from "@/hooks/use-alias-check"
import { useAcceptedEmoji } from "@/hooks/use-emoji-set"
import { useCreateOptionTracker } from "@/hooks/use-create-option-tracker"

/** Terse register for the first-run badge (the muted-mono AliasBadge). The
    hint-length prose the composer uses would be too loud here. The emoji_policy
    case names the offending emoji from the accepted set when it is loaded. */
function aliasTerse(
  reason: CheckAliasReason,
  alias: string,
  accepted: Set<string> | null
): string {
  switch (reason) {
    case "emoji_policy": {
      const offenders = accepted
        ? findUnsupportedGraphemes(alias, accepted)
        : []
      if (offenders.length === 1) return `${offenders[0]} not supported`
      if (offenders.length > 1)
        return `${offenders[0]} +${offenders.length - 1} not supported`
      return "unsupported emoji"
    }
    case "length":
      return !isEmojiCandidate(alias) && alias.length < 3
        ? "3+ characters"
        : "too long"
    case "format":
      return "letters or emoji, not both"
    case "reserved":
      return "reserved"
    case "taken":
      return "already taken"
  }
}

type BadgeState =
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
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [created, setCreated] = React.useState<ShortUrl | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [qrOpen, setQrOpen] = React.useState(false)
  const linkRef = React.useRef<HTMLDivElement>(null)
  // Deliberate option use (set <-> cleared edges only); the alias is the
  // one create option this step offers.
  const optionUse = useCreateOptionTracker("onboarding")

  const urlLooksValid = /^https?:\/\/\S+\.\S+/.test(url.trim())

  // Live alias availability via the shared hook (letters/numbers OR emoji);
  // the terse first-run badge maps the reason. A create-time collision is
  // shown through `serverTaken`, keyed to the alias it answered.
  const aliasVerdict = useAliasCheck({ alias })
  const acceptedEmoji = useAcceptedEmoji()
  const [serverTaken, setServerTaken] = React.useState<string | null>(null)
  const badge: BadgeState =
    aliasVerdict.state === "checking"
      ? { kind: "checking" }
      : aliasVerdict.state === "available"
        ? { kind: "available" }
        : // idle and unknown (check couldn't complete) show no badge; the
          // create call re-validates.
          aliasVerdict.state === "problem"
          ? {
              kind: "unavailable",
              reason: aliasTerse(aliasVerdict.reason, alias, acceptedEmoji),
            }
          : { kind: "idle" }
  const showBadge: BadgeState =
    serverTaken === alias && alias
      ? { kind: "unavailable", reason: "already taken" }
      : badge

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!urlLooksValid || pending || created) return
    if (alias && aliasVerdict.state === "problem") return
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
        setServerTaken(alias)
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
      <h1 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
        {created ? "Your first link is live" : "Create your first link"}
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed">
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
                    <Check className="size-3.5 text-live" />
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
              <Button
                onClick={() => setQrOpen(true)}
                size="sm"
                variant="outline"
              >
                <QrCode className="size-3.5" />
                QR code
              </Button>
            </div>

            <Button
              onClick={() => onDone(created)}
              className="mt-12 h-10 min-w-44"
            >
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
              <label
                htmlFor="ob-url"
                className="font-medium text-foreground text-sm"
              >
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
                <label
                  htmlFor="ob-alias"
                  className="font-medium text-foreground text-sm"
                >
                  Custom alias
                </label>
                <span className="text-muted-foreground/70 text-xs">
                  optional
                </span>
              </div>
              <div className="flex items-center rounded-lg border border-input shadow-soft transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                <span className="border-border/60 border-r px-3 font-mono text-muted-foreground text-sm">
                  spoo.me/
                </span>
                <input
                  id="ob-alias"
                  value={alias}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\s+/g, "")
                    optionUse.note("alias", v !== "")
                    setAlias(v)
                  }}
                  placeholder="launch"
                  className="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              {/* State reads beneath the box, like every other field's helper
                  line (no inline-right badge). */}
              <AliasBadge state={showBadge} />
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
                // Block only on a known problem; a still-checking or
                // indeterminate alias submits and is re-validated on create.
                (alias.length > 0 && aliasVerdict.state === "problem")
              }
            >
              {pending ? "Shortening…" : "Shorten it"}
              {!pending && (
                <ArrowRight className="size-4" data-icon="inline-end" />
              )}
            </Button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-muted-foreground/70 text-xs underline-offset-4 transition-colors hover:text-foreground hover:underline"
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
      <div className="font-mono font-semibold text-3xl tracking-tight sm:text-4xl">
        <span className="text-muted-foreground/45">{host}</span>
        <span className="text-foreground">{slug}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground/70 text-xs">
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

/* The alias state as a beneath-the-box line, matching the other fields'
   helper/error placement: muted mono while neutral, error color for a
   blocking problem. */
function AliasBadge({ state }: { state: BadgeState }) {
  if (state.kind === "idle") return null
  return (
    <p
      className={cn(
        "font-mono text-xs",
        state.kind === "available" && "text-live",
        state.kind === "checking" && "text-muted-foreground/70",
        state.kind === "unavailable" && "text-destructive"
      )}
      aria-live="polite"
    >
      {state.kind === "checking"
        ? "checking…"
        : state.kind === "available"
          ? "available"
          : state.reason}
    </p>
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
        className="gap-5 bg-background p-7 text-center sm:max-w-xs"
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
          onClick={() => {
            trackUiAction("qr_downloaded")
            downloadQrPng(tileRef.current, `spoo-${created.alias}.png`)
          }}
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
