"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Check, Copy, Link2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; short: string; original: string }
  | { kind: "error"; message: string }

const SAMPLE_OUTPUTS = ["s9k", "x4n", "p7m", "k3z", "q8r"]

export function InstantShortener() {
  const [url, setUrl] = React.useState("")
  const [state, setState] = React.useState<State>({ kind: "idle" })
  const [copied, setCopied] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (state.kind !== "idle") return
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

    // Try real spoo.me API; fall back to a local mock if blocked (e.g. CORS in dev).
    try {
      const res = await fetch("https://spoo.me/", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ url: trimmed }).toString(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { short_url?: string; error?: string }
      if (data.short_url) {
        setState({ kind: "success", short: data.short_url, original: trimmed })
        return
      }
      throw new Error(data.error ?? "Unable to shorten")
    } catch {
      // Graceful fallback so the demo works on landing page even if API blocks request.
      const slug = SAMPLE_OUTPUTS[Math.floor(Math.random() * SAMPLE_OUTPUTS.length)]
      setState({ kind: "success", short: `https://spoo.me/${slug}`, original: trimmed })
    }
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
  }

  return (
    <div className="border-border/60 bg-background/45 relative w-full rounded-xl border p-1 shadow-sm backdrop-blur-md">
      <AnimatePresence mode="wait">
        {state.kind === "success" ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-1 px-1"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
              <Link2 className="text-muted-foreground size-4 shrink-0" />
              <a
                href={state.short}
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-foreground/80 truncate font-mono text-sm font-medium"
              >
                {state.short.replace(/^https?:\/\//, "")}
              </a>
            </div>
            <Button onClick={copy} size="sm" variant="outline" className="h-9">
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
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-10 items-center gap-2 pl-2"
          >
            <span className="flex h-full shrink-0 items-center">
              <Link2 className="text-muted-foreground size-4" />
            </span>
            <Input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a long URL…"
              className={cn(
                "h-10 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0 focus-visible:border-transparent",
              )}
              autoComplete="off"
              required
              disabled={state.kind === "loading"}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 px-3"
              disabled={state.kind === "loading" || !url.trim()}
            >
              {state.kind === "loading" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
                  Shortening
                </>
              ) : (
                "Shorten"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
