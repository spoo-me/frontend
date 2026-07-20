"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowUpRight,
  ChartLine,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Loader2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  trackLinkCreatedAnonymous,
  trackManagePitchClicked,
  trackResultCardViewed,
} from "@/lib/analytics"
import { addRecentLink } from "@/lib/recent-links"

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; short: string; code: string; original: string }
  | { kind: "error"; message: string }

export function InstantShortener() {
  const [url, setUrl] = React.useState("")
  const [alias, setAlias] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [maxClicks, setMaxClicks] = React.useState("")
  const [showOptions, setShowOptions] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, setState] = React.useState<State>({ kind: "idle" })
  const [copied, setCopied] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (state.kind !== "idle" && state.kind !== "error") return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }
      const text = e.clipboardData?.getData("text/plain")?.trim()
      if (!text || !/^https?:\/\/\S+\.\S+/i.test(text)) return
      e.preventDefault()
      setUrl(text)
      inputRef.current?.focus()
    }
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [state.kind])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setState({ kind: "loading" })

    const body = new URLSearchParams({ url: trimmed })
    const aliasTrim = alias.trim()
    const passwordTrim = password.trim()
    const maxTrim = maxClicks.trim()
    if (aliasTrim) body.set("alias", aliasTrim)
    if (passwordTrim) body.set("password", passwordTrim)
    if (maxTrim) body.set("max-clicks", maxTrim)

    try {
      // Same-origin proxy (next.config.mjs): dev -> the local backend,
      // mock -> the in-repo handler, prod -> spoo.me. No CORS anywhere.
      const res = await fetch("/shorten", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      })
      const data = (await res.json().catch(() => ({}))) as {
        short_url?: string
        [k: string]: unknown
      }
      if (res.ok && data.short_url) {
        succeed(data.short_url, trimmed, !!aliasTrim, !!passwordTrim, !!maxTrim)
        return
      }
      // The v1 API reports field errors as { FieldName: "message" }.
      const message =
        Object.values(data).find((v): v is string => typeof v === "string") ??
        "Couldn't shorten that URL. Try again."
      setState({ kind: "error", message })
    } catch {
      setState({
        kind: "error",
        message: "Couldn't reach spoo.me. Check your connection and retry.",
      })
    }
  }

  function succeed(
    short: string,
    original: string,
    hasAlias: boolean,
    hasPassword: boolean,
    hasMaxClicks: boolean
  ) {
    const code = short.replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "")
    setState({ kind: "success", short, code, original })
    addRecentLink({ code, short, original, createdAt: Date.now() })
    trackLinkCreatedAnonymous({
      usedOptions: hasAlias || hasPassword || hasMaxClicks,
      hasAlias,
      hasPassword,
      hasMaxClicks,
    })
    trackResultCardViewed()
  }

  async function copy() {
    if (state.kind !== "success") return
    await navigator.clipboard.writeText(state.short)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  function reset() {
    setState({ kind: "idle" })
    setUrl("")
    setAlias("")
    setPassword("")
    setMaxClicks("")
    setShowOptions(false)
  }

  return (
    <div className="relative w-full rounded-xl border border-border/60 bg-background/45 p-1 shadow-soft backdrop-blur-md dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <AnimatePresence mode="wait" initial={false}>
        {state.kind === "success" ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-1 px-1">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
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
                onClick={copy}
                size="sm"
                variant="outline"
                className="h-9"
              >
                {copied ? (
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
              <Button onClick={reset} size="sm" variant="ghost" className="h-9">
                New
              </Button>
            </div>
            {/* The manage row: this link has a live stats page already, and
                an account is the only way to edit it later. The plan's #1
                signup surface. */}
            <div className="mt-1 flex items-center justify-between gap-3 border-border/50 border-t px-3 pt-2 pb-1.5 text-xs">
              <a
                href={`/stats/${state.code}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChartLine className="size-3" />
                live stats
              </a>
              <Link
                href="/signup"
                onClick={() => trackManagePitchClicked()}
                className="inline-flex items-center gap-1 font-medium text-foreground/90 transition-colors hover:text-foreground"
              >
                Sign up to keep and edit it
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex h-10 items-center gap-2 pl-2">
              <span className="flex h-full shrink-0 items-center">
                <Link2 className="size-4 text-muted-foreground" />
              </span>
              <Input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a long URL…"
                className={cn(
                  "h-10 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
                )}
                autoComplete="off"
                required
                disabled={state.kind === "loading"}
              />
              <button
                type="button"
                onClick={() => setShowOptions((v) => !v)}
                aria-expanded={showOptions}
                className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
              >
                Options
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform duration-200",
                    showOptions && "rotate-180"
                  )}
                />
              </button>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-3"
                disabled={state.kind === "loading" || !url.trim()}
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
                  "Shorten"
                )}
              </Button>
            </div>

            {/* The old powers, one click away: alias, password, max clicks.
                Growth animates, collapse snaps. */}
            <AnimatePresence initial={false}>
              {showOptions && (
                <motion.div
                  key="options"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0, transition: { duration: 0 } }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    <div className="flex items-center rounded-lg bg-input/30 pl-2.5">
                      <span className="shrink-0 font-mono text-muted-foreground/70 text-xs">
                        spoo.me/
                      </span>
                      <Input
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="alias"
                        aria-label="Custom alias"
                        autoComplete="off"
                        className="h-8 border-0 bg-transparent px-1 font-mono text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:shadow-none"
                      />
                    </div>
                    <div className="flex items-center rounded-lg bg-input/30 pr-2">
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        aria-label="Link password"
                        autoComplete="new-password"
                        className="h-8 border-0 bg-transparent px-2.5 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:shadow-none"
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                        className="shrink-0 text-muted-foreground/60 transition-colors duration-150 hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                    <Input
                      value={maxClicks}
                      onChange={(e) => setMaxClicks(e.target.value)}
                      type="number"
                      min={1}
                      placeholder="Max clicks"
                      aria-label="Max clicks"
                      autoComplete="off"
                      className="h-8 rounded-lg border-0 bg-input/30 px-2.5 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:shadow-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {state.kind === "error" && (
              <p className="px-3 pt-1 pb-1.5 text-left text-destructive/90 text-xs">
                {state.message}
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
