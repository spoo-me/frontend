"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowUpRight,
  ChartLine,
  Check,
  Copy,
  Flag,
  Link2,
  Loader2,
  Mail,
  Megaphone,
  MousePointerClick,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { trackUiAction } from "@/lib/analytics"
import { shorten, SpooApiError } from "@/lib/api"

type Params = {
  source: string
  medium: string
  campaign: string
  term: string
  content: string
}

const EMPTY: Params = {
  source: "",
  medium: "",
  campaign: "",
  term: "",
  content: "",
}

const FIELDS: Array<{
  key: keyof Params
  label: string
  placeholder: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    key: "source",
    label: "utm_source",
    placeholder: "newsletter",
    icon: Megaphone,
  },
  { key: "medium", label: "utm_medium", placeholder: "email", icon: Mail },
  {
    key: "campaign",
    label: "utm_campaign",
    placeholder: "spring-launch",
    icon: Flag,
  },
  {
    key: "term",
    label: "utm_term",
    placeholder: "link shortener",
    icon: Search,
  },
  {
    key: "content",
    label: "utm_content",
    placeholder: "footer-cta",
    icon: MousePointerClick,
  },
]

function buildUrl(raw: string, params: Params): string | null {
  const trimmed = raw.trim()
  if (!/^https?:\/\/\S+\.\S+/i.test(trimmed)) return null
  try {
    const url = new URL(trimmed)
    for (const { key, label } of FIELDS) {
      const value = params[key].trim()
      if (value) url.searchParams.set(label, value)
    }
    return url.toString()
  } catch {
    return null
  }
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; short: string; code: string }
  | { kind: "error"; message: string }

export function UtmBuilder() {
  const [url, setUrl] = React.useState("")
  const [params, setParams] = React.useState<Params>(EMPTY)
  const [state, setState] = React.useState<State>({ kind: "idle" })
  const [copied, setCopied] = React.useState<"url" | "short" | null>(null)

  const built = buildUrl(url, params)
  const tagged = built !== null && /[?&]utm_/.test(built)

  function setParam(key: keyof Params) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setParams((p) => ({ ...p, [key]: e.target.value }))
      setState((st) => (st.kind === "error" ? { kind: "idle" } : st))
    }
  }

  async function copyText(text: string, which: "url" | "short") {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 1600)
      if (which === "url") trackUiAction("tool_used", "utm_copy")
    } catch {
      window.prompt("Copy:", text)
    }
  }

  async function onShorten() {
    if (!built) return
    setState({ kind: "loading" })
    try {
      const link = await shorten({ long_url: built })
      trackUiAction("tool_used", "utm_shorten")
      setState({ kind: "success", short: link.short_url, code: link.alias })
    } catch (err) {
      let message =
        "Couldn't shorten that just now. Copy the tagged URL instead."
      if (err instanceof SpooApiError) {
        if (err.isRateLimit)
          message = "You're creating links quickly. Give it a minute and retry."
        // Validation refusals (spoo.me self-links, blocked destinations) are
        // permanent; say why instead of implying a retry would help.
        else if (err.field === "long_url")
          message = `${err.message} The tagged URL above still works anywhere.`
      }
      setState({ kind: "error", message })
    }
  }

  return (
    <div className="w-full rounded-xl border border-border/60 bg-background/45 shadow-soft backdrop-blur-md dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Destination — flat row, no field-in-field chrome */}
      <div className="flex h-14 items-center gap-3 px-5">
        <Link2 className="size-4 shrink-0 text-muted-foreground" />
        <Input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setState((st) => (st.kind === "error" ? { kind: "idle" } : st))
          }}
          placeholder="Paste the page you're linking to…"
          className="h-full rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:shadow-none"
          autoComplete="off"
        />
      </div>

      {/* All five tags — no fold, one grid */}
      <div className="grid gap-x-5 gap-y-5 border-border/50 border-t px-5 pt-5 pb-6 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="flex items-center gap-1.5">
              <f.icon className="size-3.5 text-muted-foreground/70" />
              <span className="label-mono text-muted-foreground">
                {f.label}
              </span>
            </span>
            <Input
              value={params[f.key]}
              onChange={setParam(f.key)}
              placeholder={f.placeholder}
              className="mt-2 h-10"
              autoComplete="off"
            />
          </label>
        ))}
      </div>

      {/* Result — one flat row, same left edge as everything above */}
      <div className="border-border/50 border-t px-5 py-4">
        <AnimatePresence mode="wait" initial={false}>
          {state.kind === "success" ? (
            <motion.div
              key="short"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-1">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Link2 className="size-4 shrink-0 text-muted-foreground" />
                  <a
                    href={state.short}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium font-mono text-foreground text-sm hover:text-foreground/80"
                  >
                    {state.short.replace(/^https?:\/\//, "")}
                  </a>
                </div>
                <Button
                  onClick={() => copyText(state.short, "short")}
                  size="sm"
                  variant="ghost"
                  className="h-9 text-muted-foreground hover:text-foreground"
                >
                  {copied === "short" ? (
                    <>
                      <Check className="size-3.5" data-icon="inline-start" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" data-icon="inline-start" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setState({ kind: "idle" })}
                  size="sm"
                  variant="ghost"
                  className="h-9"
                >
                  New
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-border/50 border-t pt-2.5 text-xs">
                <a
                  href={`/stats/${state.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border/50 px-2 font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  <ChartLine className="size-3" />
                  Live stats
                </a>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 font-medium text-foreground/90 transition-colors hover:text-foreground"
                >
                  Sign up to keep and edit it
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="built"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              {built ? (
                <code
                  title={built}
                  className={cn(
                    "min-w-0 flex-1 truncate font-mono text-[13px]",
                    tagged ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {built}
                </code>
              ) : (
                <span className="min-w-0 flex-1 truncate text-muted-foreground/70 text-sm">
                  Your tagged link appears here as you fill the fields.
                </span>
              )}
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  onClick={() => built && copyText(built, "url")}
                  variant="outline"
                  size="sm"
                  disabled={!tagged}
                >
                  {copied === "url" ? (
                    <>
                      <Check className="size-3.5" data-icon="inline-start" />
                      Copied
                    </>
                  ) : (
                    "Copy"
                  )}
                </Button>
                <Button
                  onClick={onShorten}
                  size="sm"
                  disabled={!tagged || state.kind === "loading"}
                >
                  {state.kind === "loading" ? (
                    <>
                      <Loader2
                        className="size-3.5 animate-spin"
                        data-icon="inline-start"
                      />
                      Shortening
                    </>
                  ) : (
                    "Shorten & track"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {state.kind === "error" && (
          <p className="mt-2 text-destructive text-xs">{state.message}</p>
        )}
      </div>
    </div>
  )
}
