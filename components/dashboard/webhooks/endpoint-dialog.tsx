"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createWebhook,
  listWebhookEventTypes,
  updateWebhook,
  type WebhookEndpoint,
  type WebhookFlavor,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LinkScopePicker } from "./link-scope-picker"

/** UI copy for the event list — the catalog's `description` is API
    documentation prose, not interface copy. */
const EVENT_COPY: Record<string, string> = {
  "link.created": "a link was created",
  "link.updated": "a link was edited",
  "link.deleted": "a link was deleted",
  "link.clicked": "a tracked click happened",
  "link.expired": "a link hit its expiry or click limit",
}

/** Flavor is auto-configured from the URL, never a user decision: a
    Discord or Slack webhook URL gets the rendered message, everything
    else gets the raw signed contract. */
export function detectFlavor(url: string): WebhookFlavor {
  try {
    const u = new URL(url)
    const host = u.host.toLowerCase()
    if (
      (host === "discord.com" ||
        host === "discordapp.com" ||
        host === "ptb.discord.com" ||
        host === "canary.discord.com") &&
      u.pathname.startsWith("/api/webhooks/")
    )
      return "discord"
    if (host === "hooks.slack.com") return "slack"
  } catch {
    /* not a URL yet */
  }
  return "raw"
}

export function EndpointDialog({
  mode,
  endpoint,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit"
  endpoint?: WebhookEndpoint
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [url, setUrl] = React.useState("")
  const [events, setEvents] = React.useState<string[]>([])
  const [scopeLinks, setScopeLinks] = React.useState<string[]>([])
  const [description, setDescription] = React.useState("")

  // Seed from the endpoint whenever the dialog opens in edit mode.
  React.useEffect(() => {
    if (!open) return
    if (mode === "edit" && endpoint) {
      setUrl(endpoint.url)
      setEvents(endpoint.events)
      setScopeLinks(endpoint.scope_links ?? [])
      setDescription(endpoint.description ?? "")
    }
  }, [open, mode, endpoint])

  const catalog = useQuery({
    queryKey: ["webhook-event-types"],
    queryFn: listWebhookEventTypes,
    staleTime: Number.POSITIVE_INFINITY,
    enabled: open,
  })
  // webhook.test is sendable, not subscribable.
  const subscribable = (catalog.data ?? []).filter(
    (e) => e.type !== "webhook.test"
  )

  const flavor = detectFlavor(url.trim())

  const reset = () => {
    setUrl("")
    setEvents([])
    setScopeLinks([])
    setDescription("")
  }

  const save = useMutation({
    mutationFn: () => {
      if (mode === "create")
        return createWebhook({
          url: url.trim(),
          events,
          flavor,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(scopeLinks.length ? { scope_links: scopeLinks } : {}),
        })
      return updateWebhook(endpoint!.id, {
        url: url.trim(),
        events,
        flavor,
        description: description.trim() || null,
        scope_links: scopeLinks.length ? scopeLinks : null,
      })
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
      onOpenChange(false)
      if (mode === "create") {
        // The endpoint page has everything, secret included — no
        // interstitial.
        toast.success("Endpoint created")
        router.push(`/dashboard/webhooks/${saved.id}`)
      } else {
        toast.success("Endpoint updated")
      }
    },
    onError: (e) =>
      toast.error(
        e instanceof Error ? e.message : "Couldn't save the endpoint"
      ),
  })

  const valid = /^https:\/\/.+/.test(url.trim()) && events.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "New endpoint" : "Edit endpoint"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex h-4 items-center justify-between">
                <Label className="font-medium text-foreground text-xs">
                  URL
                </Label>
                {/* Auto-configured presentation: Discord and Slack URLs
                      get a rendered message instead of the raw contract. */}
                {flavor !== "raw" && (
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {flavor}
                  </span>
                )}
              </div>
              <Input
                autoFocus={mode === "create"}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/hooks/spoo"
                spellCheck={false}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-medium text-foreground text-xs">
                Events
              </Label>
              <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
                {catalog.isPending ? (
                  <div className="px-3 py-2 text-muted-foreground text-xs">
                    Loading…
                  </div>
                ) : (
                  subscribable.map((spec) => (
                    <label
                      key={spec.type}
                      className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors duration-150 hover:bg-accent/30"
                    >
                      <Checkbox
                        checked={events.includes(spec.type)}
                        onCheckedChange={(v) =>
                          setEvents(
                            v === true
                              ? [...events, spec.type]
                              : events.filter((e) => e !== spec.type)
                          )
                        }
                      />
                      <span className="w-32 shrink-0 font-mono text-foreground text-xs">
                        {spec.type}
                      </span>
                      <span className="truncate text-muted-foreground/70 text-xs">
                        {EVENT_COPY[spec.type] ?? ""}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-medium text-foreground text-xs">
                Links
              </Label>
              <LinkScopePicker value={scopeLinks} onChange={setScopeLinks} />
            </div>

            <div className="space-y-1.5">
              <Label className="font-medium text-foreground text-xs">
                Description{" "}
                <span className="font-normal text-muted-foreground/60">
                  (optional)
                </span>
              </Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. clicks to #launch-channel"
                maxLength={256}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              disabled={!valid || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending
                ? "Saving…"
                : mode === "create"
                  ? "Create endpoint"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  )
}
