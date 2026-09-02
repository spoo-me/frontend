"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link2, LoaderCircle, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"

import { shorten, SpooApiError, type ShortenInput } from "@/lib/api"
import { trackLinkCreated } from "@/lib/analytics"
import { normalizeUrl, urlProblem } from "@/lib/validation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/dashboard/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { notifyLinkCreated } from "@/components/dashboard/links/create-toast"
import { openLinkComposer } from "@/components/dashboard/links/composer"

/**
 * The overview's first job: a quarter of visits here create a link. One
 * field, one button, defaults for everything else; the composer is a click
 * away with the URL carried over. A URL pasted anywhere on the page lands
 * in the field, same as the landing box.
 */

export function CreateBox() {
  const queryClient = useQueryClient()
  const [url, setUrl] = React.useState("")
  // Server verdicts (blocklist, rate limit) pin to the URL they rejected so
  // fresh input clears them.
  const [serverError, setServerError] = React.useState<{
    url: string
    message: string
  } | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // The client mirror speaks only once typing settles (the composer's
  // debounce) so half-typed URLs aren't scolded; a submit settles it at once.
  const [settled, setSettled] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setSettled(normalizeUrl(url)), 600)
    return () => clearTimeout(t)
  }, [url])

  const normalized = normalizeUrl(url)
  const problem = url.trim() ? urlProblem(url) : null
  const error =
    (settled === normalized ? problem : null) ??
    (serverError && serverError.url === normalized ? serverError.message : null)

  const create = useMutation({
    mutationFn: (input: ShortenInput) => shorten(input),
    onSuccess: (created, input) => {
      trackLinkCreated(input, "overview")
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      setUrl("")
      notifyLinkCreated(created.short_url)
    },
    onError: (err, input) => {
      if (err instanceof SpooApiError && err.isRateLimit) {
        setServerError({
          url: input.long_url,
          message: "You're creating links quickly. Give it a minute and retry.",
        })
      } else if (err instanceof SpooApiError && err.field === "long_url") {
        setServerError({
          url: input.long_url,
          message:
            err.message === "URL is blocked"
              ? "That destination is blocked on spoo.me."
              : err.message,
        })
      } else {
        toast.error(
          err instanceof Error ? err.message : "Couldn't create the link"
        )
      }
    },
  })

  const canCreate = url.trim() !== "" && !problem && !error && !create.isPending

  React.useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return
      // An open dialog owns its paste: the composer has its own URL field.
      if (document.querySelector("[role=dialog][data-state=open]")) return
      // Only while the box is on screen, so a paste never fills an unseen field.
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
  }, [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSettled(normalized)
        if (canCreate) create.mutate({ long_url: normalized })
      }}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1 transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          error &&
            "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
        )}
      >
        <Link2 className="ml-2.5 size-4 shrink-0 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a long URL to shorten it"
          aria-label="Destination URL"
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={create.isPending}
          className="h-9 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0 aria-invalid:border-transparent aria-invalid:ring-0 dark:bg-transparent dark:shadow-none"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="More options"
              onClick={() => openLinkComposer({ longUrl: url })}
              className="text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Alias, password, expiry and more</TooltipContent>
        </Tooltip>
        <Button type="submit" disabled={!canCreate}>
          {create.isPending && (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          )}
          Create
          <Kbd className="ml-0.5 border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/80 max-sm:hidden">
            ↵
          </Kbd>
        </Button>
      </div>
      {/* Reserved line: the message appears without moving the cards. */}
      <p
        aria-live="polite"
        className="mt-1.5 min-h-4 px-1 text-destructive text-xs leading-4"
      >
        {error}
      </p>
    </form>
  )
}
