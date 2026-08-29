"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Copy, Info, Link2, Loader2 } from "lucide-react"
import {
  FaDiscord,
  FaLinkedinIn,
  FaSlack,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MetaPreview,
  type MetaPlatform,
} from "@/components/shared/meta-preview"
import { trackToolAction } from "@/lib/analytics"
import { fetchUrlMetadata, SpooApiError, type UrlMetadata } from "@/lib/api"
import { normalizeUrl } from "@/lib/validation"

const PLATFORMS: Array<{
  key: MetaPlatform
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { key: "x", label: "X", icon: FaXTwitter },
  { key: "discord", label: "Discord", icon: FaDiscord },
  { key: "slack", label: "Slack", icon: FaSlack },
  { key: "whatsapp", label: "WhatsApp", icon: FaWhatsapp },
  { key: "linkedin", label: "LinkedIn", icon: FaLinkedinIn },
]

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; data: UrlMetadata; checked: string; demo?: boolean }
  | { kind: "error"; message: string; unfetchable?: boolean; domain?: string }

export function LinkPreviewChecker({ demo }: { demo: UrlMetadata | null }) {
  const [url, setUrl] = React.useState("")
  // The page opens already demonstrating itself, from tags the server
  // fetched — so the example costs the visitor no rate-limit budget and
  // its cards are in the HTML for crawlers.
  const [state, setState] = React.useState<State>(
    demo
      ? { kind: "done", data: demo, checked: demo.url, demo: true }
      : { kind: "idle" }
  )

  async function onCheck() {
    const target = normalizeUrl(url)
    let parsed: URL
    try {
      parsed = new URL(target)
      if (!parsed.hostname.includes(".")) throw new Error()
    } catch {
      setState({ kind: "error", message: "That doesn't look like a URL." })
      return
    }
    if (parsed.protocol !== "https:") {
      setState({
        kind: "error",
        message: "Only https pages can be checked.",
      })
      return
    }
    setState({ kind: "loading" })
    try {
      const data = await fetchUrlMetadata(parsed.toString())
      trackToolAction("link-preview", "used")
      setState({ kind: "done", data, checked: parsed.toString() })
    } catch (err) {
      if (err instanceof SpooApiError) {
        if (err.isRateLimit)
          return setState({
            kind: "error",
            message: "You're checking quickly. Give it a minute and retry.",
          })
        // The backend deliberately hides WHY a fetch failed (a specific
        // reason would let callers probe internal hostnames), so this
        // covers 404s, bot walls, and non-HTML files alike.
        if (err.code === "unfetchable")
          return setState({
            kind: "error",
            unfetchable: true,
            domain: parsed.hostname.replace(/^www\./, ""),
            message:
              "The page may not exist, may not be an HTML page, or the site may only answer to browsers and platform crawlers. In that last case X or Discord can still render a card we can't see.",
          })
        if (err.code === "upstream_timeout")
          return setState({
            kind: "error",
            message: "The page took too long to respond. Try again in a bit.",
          })
        return setState({ kind: "error", message: err.message })
      }
      setState({
        kind: "error",
        message: "Couldn't check that just now. Try again.",
      })
    }
  }

  const busy = state.kind === "loading"

  return (
    <div>
      <div className="w-full rounded-xl border border-border/60 bg-background/45 shadow-soft backdrop-blur-md dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex h-14 items-center gap-3 py-2 pr-2.5 pl-5">
          <Link2 className="size-4 shrink-0 text-muted-foreground" />
          <Input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setState((st) => (st.kind === "error" ? { kind: "idle" } : st))
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim() && !busy) onCheck()
            }}
            placeholder="Paste the page to check…"
            className="h-full rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:shadow-none"
            autoComplete="off"
            // biome-ignore lint/a11y/noAutofocus: the input IS the page
            autoFocus
          />
          <Button
            onClick={onCheck}
            size="sm"
            disabled={!url.trim() || busy}
            className="shrink-0"
          >
            {busy ? (
              <>
                <Loader2
                  className="size-3.5 animate-spin"
                  data-icon="inline-start"
                />
                Checking
              </>
            ) : (
              "Check preview"
            )}
          </Button>
        </div>
        {state.kind === "error" && !state.unfetchable && (
          <div className="border-border/50 border-t px-5 py-3">
            <p className="text-destructive text-xs">{state.message}</p>
          </div>
        )}
      </div>

      {state.kind === "error" && state.unfetchable && (
        <div className="mt-6 flex gap-3 rounded-xl border border-border/60 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground text-sm">
              Couldn't read {state.domain}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              {state.message}
            </p>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {state.kind === "done" && (
          <motion.div
            key={state.checked}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            {state.demo && (
              <p className="mb-2.5 font-mono text-[11px] text-muted-foreground/70">
                example: previewing spoo.me. Paste any link above to check your
                own.
              </p>
            )}
            <div className="grid rounded-xl border border-border/60 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="order-2 min-w-0 p-6 lg:order-1 lg:border-0">
                <div className="lg:sticky lg:top-24">
                  <TagAudit data={state.data} />
                </div>
              </div>
              <div className="order-1 min-w-0 border-border/50 border-b p-6 sm:p-8 lg:order-2 lg:border-b-0 lg:border-l">
                <div className="space-y-9">
                  {PLATFORMS.map((p) => (
                    <PlatformBlock key={p.key} platform={p} data={state.data} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlatformBlock({
  platform,
  data,
}: {
  platform: (typeof PLATFORMS)[number]
  data: UrlMetadata
}) {
  const domain = React.useMemo(() => {
    try {
      return new URL(data.final_url).hostname.replace(/^www\./, "")
    } catch {
      return data.final_url
    }
  }, [data.final_url])
  const Icon = platform.icon
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="label-mono text-muted-foreground">
          {platform.label}
        </span>
      </div>
      <div className="max-w-md">
        <MetaPreview
          platform={platform.key}
          title={data.title ?? ""}
          description={data.description ?? ""}
          image={data.image ?? ""}
          domain={domain}
          url={data.final_url}
          color={data.color ?? undefined}
          emptyTitle="No title tag found"
          emptyDescription="No description found."
        />
      </div>
    </div>
  )
}

type TagKind = "text" | "url" | "color" | "icon"

const CARD_TYPES = new Set(["summary", "summary_large_image", "app", "player"])

/* Soft limits, not hard errors: where the major platforms and SERPs start
   clipping. Long values still work — they just get cut. */
function tagWarning(name: string, value: string): string | null {
  const len = [...value].length
  if ((name === "title" || name === "og:title") && len > 60)
    return `${len} characters; clips near 60 on most surfaces`
  if ((name === "description" || name === "og:description") && len > 160)
    return `${len} characters; clips near 160 on most surfaces`
  if (name === "twitter:card" && !CARD_TYPES.has(value))
    return "not a valid card type; X will ignore it"
  return null
}

function TagAudit({ data }: { data: UrlMetadata }) {
  const rows: Array<{
    name: string
    value: string | null | undefined
    kind: TagKind
  }> = [
    { name: "og:title", value: data.og.title, kind: "text" },
    { name: "og:description", value: data.og.description, kind: "text" },
    { name: "og:image", value: data.og.image, kind: "url" },
    { name: "og:site_name", value: data.og.site_name, kind: "text" },
    { name: "twitter:card", value: data.twitter.card, kind: "text" },
    { name: "theme-color", value: data.color, kind: "color" },
    { name: "title", value: data.html_title, kind: "text" },
    { name: "description", value: data.html_description, kind: "text" },
    { name: "favicon", value: data.favicon, kind: "icon" },
  ]
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label-mono text-muted-foreground">Meta tags</span>
        <span className="font-mono text-[11px] text-muted-foreground/70 tabular-nums">
          {rows.filter((r) => r.value).length}/{rows.length}
        </span>
      </div>
      <div className="mt-2">
        {rows.map((r) => (
          <TagRow key={r.name} {...r} />
        ))}
      </div>
    </div>
  )
}

function TagRow({
  name,
  value,
  kind,
}: {
  name: string
  value: string | null | undefined
  kind: TagKind
}) {
  const [copied, setCopied] = React.useState(false)
  const [iconBroken, setIconBroken] = React.useState(false)
  const warning = value ? tagWarning(name, value) : null

  async function copy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt("Copy:", value)
    }
  }

  return (
    <div className="group border-border/40 border-b py-3 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-muted-foreground text-xs">{name}</span>
        {value && (
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${name}`}
            className="text-muted-foreground/50 opacity-0 transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
      </div>
      {value ? (
        <div className="mt-1 flex items-start gap-2">
          {kind === "color" && (
            <span
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 rounded-[4px] border border-border/60"
              style={{ backgroundColor: value }}
            />
          )}
          {kind === "icon" && !iconBroken && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              onError={() => setIconBroken(true)}
              className="mt-0.5 size-3.5 shrink-0 rounded-[3px]"
            />
          )}
          <span
            title={value}
            className={cn(
              "min-w-0 font-mono text-[13px] text-foreground/90",
              kind === "text"
                ? "line-clamp-3 break-words"
                : "line-clamp-2 break-all"
            )}
          >
            {value}
          </span>
        </div>
      ) : (
        <div className="mt-1 font-mono text-[13px] text-muted-foreground/50">
          missing
        </div>
      )}
      {warning && (
        <p className="mt-1 font-mono text-[11px] text-destructive/90">
          {warning}
        </p>
      )}
    </div>
  )
}
