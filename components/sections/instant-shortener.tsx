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
  trackUiAction,
  type CreateOption,
} from "@/lib/analytics"
import { addRecentLink } from "@/lib/recent-links"
import {
  shorten,
  SpooApiError,
  type ShortenInput,
  type ShortUrl,
} from "@/lib/api"
import { useCreateOptionTracker } from "@/hooks/use-create-option-tracker"

/* v1 field names -> the options fold's fields, so a server rejection on a
   folded-away input can open the fold before showing its message. */
const FOLD_FIELDS = new Set(["alias", "password", "max_clicks"])

function friendlyError(err: unknown): {
  field: string | null
  message: string
} {
  if (err instanceof SpooApiError) {
    if (err.isRateLimit)
      return {
        field: null,
        message: "You're creating links quickly. Give it a minute and retry.",
      }
    if (err.status === 409)
      return { field: "alias", message: "That alias is taken. Try another." }
    return { field: err.field ?? null, message: err.message }
  }
  return {
    field: null,
    message: "Couldn't reach spoo.me. Check your connection and retry.",
  }
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; short: string; code: string; original: string }
  | { kind: "error"; message: string }

export function InstantShortener({
  onSuccessChange,
}: {
  /** Lets the hero quiet its CTAs while a result is showing. */
  onSuccessChange?: (success: boolean) => void
}) {
  const [url, setUrl] = React.useState("")
  const [alias, setAlias] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [maxClicks, setMaxClicks] = React.useState("")
  const [showOptions, setShowOptions] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, setState] = React.useState<State>({ kind: "idle" })
  const [copied, setCopied] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  // Deliberate option use (set <-> cleared edges only) — server logs can't
  // tell a chosen option from a frontend default.
  const optionUse = useCreateOptionTracker("hero")

  /* Editing anything retires a stale error. */
  function edit(set: (v: string) => void, option?: CreateOption) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (option) optionUse.note(option, e.target.value.trim() !== "")
      set(e.target.value)
      setState((st) => (st.kind === "error" ? { kind: "idle" } : st))
    }
  }

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
      // Only while the shortener is on screen — pasting three sections
      // deep shouldn't silently hijack the clipboard into an unseen box.
      const box = inputRef.current?.getBoundingClientRect()
      if (!box || box.bottom < 0 || box.top > window.innerHeight) return
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

    const aliasTrim = alias.trim()
    const passwordTrim = password.trim()
    const maxTrim = maxClicks.trim()
    const maxNum = Number(maxTrim)
    // A filled field must cap the link or block the submit — silently
    // creating an uncapped link while the field shows a value is worse
    // than either.
    if (maxTrim && (!Number.isFinite(maxNum) || maxNum < 1)) {
      setShowOptions(true)
      setState({
        kind: "error",
        message: "Max clicks must be a positive number.",
      })
      return
    }

    // v2 create: anonymous responses carry the one-time claim token that
    // lets signup adopt this link later; signed-in visitors get an owned
    // link instead of an orphan. Cookies ride the same-origin proxy.
    const input: ShortenInput = {
      long_url: trimmed,
      ...(aliasTrim ? { alias: aliasTrim } : {}),
      ...(passwordTrim ? { password: passwordTrim } : {}),
      ...(maxTrim ? { max_clicks: maxNum } : {}),
    }
    try {
      const link = await shorten(input)
      succeed(link, trimmed, !!aliasTrim, !!passwordTrim, !!input.max_clicks)
    } catch (err) {
      const { field, message } = friendlyError(err)
      if (field && FOLD_FIELDS.has(field)) setShowOptions(true)
      setState({ kind: "error", message })
    }
  }

  function succeed(
    link: ShortUrl,
    original: string,
    hasAlias: boolean,
    hasPassword: boolean,
    hasMaxClicks: boolean
  ) {
    const { alias: code, short_url: short } = link
    setState({ kind: "success", short, code, original })
    onSuccessChange?.(true)
    addRecentLink({
      code,
      short,
      original,
      createdAt: Date.now(),
      urlId: link.id,
      claimToken: link.claim_token ?? undefined,
    })
    trackLinkCreatedAnonymous({
      usedOptions: hasAlias || hasPassword || hasMaxClicks,
      hasAlias,
      hasPassword,
      hasMaxClicks,
    })
    trackResultCardViewed()

    // One small brand-toned burst from the card. Deliberately restrained:
    // ~2 dozen particles, quick decay, honors prefers-reduced-motion.
    setTimeout(async () => {
      const el = cardRef.current
      if (!el || typeof window === "undefined") return
      const r = el.getBoundingClientRect()
      const confetti = (await import("canvas-confetti")).default
      confetti({
        particleCount: 26,
        spread: 70,
        startVelocity: 18,
        gravity: 1.2,
        ticks: 90,
        scalar: 0.7,
        origin: {
          x: (r.left + r.width / 2) / window.innerWidth,
          y: (r.top + 16) / window.innerHeight,
        },
        colors: ["#8B5CF6", "#A78BFA", "#D4D4D8", "#71717A"],
        disableForReducedMotion: true,
      })
    }, 180)
  }

  async function copy() {
    if (state.kind !== "success") return
    try {
      await navigator.clipboard.writeText(state.short)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt("Copy your link:", state.short)
    }
  }

  function reset() {
    setState({ kind: "idle" })
    onSuccessChange?.(false)
    setUrl("")
    setAlias("")
    setPassword("")
    setMaxClicks("")
    setShowOptions(false)
    optionUse.reset()
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative w-full rounded-xl border border-border/60 bg-background/45 p-1 shadow-soft backdrop-blur-md transition-transform duration-300 ease-out dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        state.kind === "success" && "translate-y-6"
      )}
    >
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
                variant="ghost"
                className="h-9 text-muted-foreground hover:text-foreground"
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
                className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border/50 px-2 font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <ChartLine className="size-3" />
                Live stats
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
                onChange={edit(setUrl)}
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
                onClick={() => {
                  // Exploration signal, same idea as composer_tab_opened.
                  if (!showOptions) trackUiAction("shortener_options_opened")
                  setShowOptions((v) => !v)
                }}
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
                        onChange={edit(setAlias, "alias")}
                        placeholder="alias"
                        aria-label="Custom alias"
                        autoComplete="off"
                        className="h-8 border-0 bg-transparent px-1 font-mono text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:shadow-none"
                      />
                    </div>
                    <div className="flex items-center rounded-lg bg-input/30 pr-2">
                      <Input
                        value={password}
                        onChange={edit(setPassword, "password")}
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
                      onChange={edit(setMaxClicks, "max_clicks")}
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
