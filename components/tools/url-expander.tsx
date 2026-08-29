"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Info, Link2, Loader2, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DestinationCard } from "@/components/shared/destination-card"
import { trackUiAction } from "@/lib/analytics"
import { expandUrl, SpooApiError, type ExpandedUrl } from "@/lib/api"
import { normalizeUrl } from "@/lib/validation"

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; data: ExpandedUrl; checked: string }
  | { kind: "error"; message: string; unreachable?: boolean }

export function UrlExpander() {
  const [url, setUrl] = React.useState("")
  const [state, setState] = React.useState<State>({ kind: "idle" })

  async function onExpand() {
    const target = normalizeUrl(url)
    let parsed: URL
    try {
      parsed = new URL(target)
      if (!parsed.hostname.includes(".")) throw new Error()
    } catch {
      setState({ kind: "error", message: "That doesn't look like a URL." })
      return
    }
    setState({ kind: "loading" })
    try {
      const data = await expandUrl(parsed.toString())
      trackUiAction("tool_used", "expand")
      setState({ kind: "done", data, checked: parsed.toString() })
    } catch (err) {
      if (err instanceof SpooApiError) {
        if (err.isRateLimit)
          return setState({
            kind: "error",
            message: "You're expanding quickly. Give it a minute and retry.",
          })
        if (err.code === "unfetchable")
          return setState({
            kind: "error",
            unreachable: true,
            message:
              "The link may not exist anymore, or its host refuses non-browser requests. Nothing was followed.",
          })
        if (err.code === "upstream_timeout")
          return setState({
            kind: "error",
            message: "The link took too long to respond. Try again in a bit.",
          })
        return setState({ kind: "error", message: err.message })
      }
      setState({
        kind: "error",
        message: "Couldn't expand that just now. Try again.",
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
              if (e.key === "Enter" && url.trim() && !busy) onExpand()
            }}
            placeholder="Paste any short link…"
            className="h-full rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:shadow-none"
            autoComplete="off"
            // biome-ignore lint/a11y/noAutofocus: the input IS the page
            autoFocus
          />
          <Button
            onClick={onExpand}
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
                Expanding
              </>
            ) : (
              "Expand"
            )}
          </Button>
        </div>
        {state.kind === "error" && !state.unreachable && (
          <div className="border-border/50 border-t px-5 py-3">
            <p className="text-destructive text-xs">{state.message}</p>
          </div>
        )}
      </div>

      {state.kind === "error" && state.unreachable && (
        <div className="mt-6 flex gap-3 rounded-xl border border-border/60 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground text-sm">
              Couldn't reach that link
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
            className="mt-6 text-left"
          >
            {state.data.blocklist_match && (
              <div className="mb-4 flex gap-3 rounded-xl border border-destructive/40 p-4">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    This chain matches our abuse blocklist
                  </p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    A hop matches a pattern spoo.me refuses at link creation.
                    Don't enter credentials or download anything there.
                  </p>
                </div>
              </div>
            )}

            <span className="label-mono text-muted-foreground">
              Redirect chain
            </span>
            <div className="mt-2.5 overflow-x-auto rounded-xl border border-border/60 bg-card px-5 py-3">
              {state.data.hops.map((hop, i) => (
                <div
                  key={`${hop.url}-${i}`}
                  className="flex"
                  style={{ marginLeft: i === 0 ? 0 : (i - 1) * 20 }}
                >
                  {/* Each hop branches off the one above it */}
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="-mt-2 mr-2.5 mb-[15px] ml-1 w-4 shrink-0 self-stretch rounded-bl-lg border-border/60 border-b border-l"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 items-baseline gap-3 py-2">
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[13px] tabular-nums",
                        hop.status === null || hop.status >= 400
                          ? "text-destructive"
                          : hop.status >= 300
                            ? "text-muted-foreground"
                            : "text-foreground"
                      )}
                    >
                      {hop.status ?? "×"}
                    </span>
                    <span
                      title={hop.url}
                      className="min-w-0 break-all font-mono text-[15px] text-foreground"
                    >
                      {hop.url}
                    </span>
                    {!hop.https && (
                      <span className="shrink-0 font-mono text-[11px] text-destructive">
                        http
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {state.data.truncated && (
                <p className="mt-1 py-1.5 font-mono text-[11px] text-destructive">
                  stopped after {state.data.hops.length} hops; the chain kept
                  redirecting
                </p>
              )}
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/70">
              checked: redirect chain, https on every hop, spoo.me's abuse
              blocklist
            </p>

            <div className="mt-6">
              <span className="label-mono text-muted-foreground">
                Final destination
              </span>
              <div className="mt-2.5">
                <DestinationCard
                  url={state.data.final_url}
                  domain={hostnameOf(state.data.final_url)}
                  isHttps={state.data.final_url.startsWith("https://")}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
