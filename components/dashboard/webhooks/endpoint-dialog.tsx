"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import {
  createWebhook,
  listWebhookEventTypes,
  updateWebhook,
  type WebhookEndpoint,
  type WebhookFlavor,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CopyButton } from "@/components/dashboard/copy-button"
import { LinkScopePicker } from "./link-scope-picker"

const FLAVOR_OPTIONS: Array<{
  token: WebhookFlavor
  label: string
  placeholder: string
  helper: string
}> = [
  {
    token: "raw",
    label: "Raw",
    placeholder: "https://example.com/hooks/spoo",
    helper: "The documented JSON contract, signed.",
  },
  {
    token: "discord",
    label: "Discord",
    placeholder: "https://discord.com/api/webhooks/…",
    helper: "Rendered as a Discord message. Point it at a channel webhook.",
  },
  {
    token: "slack",
    label: "Slack",
    placeholder: "https://hooks.slack.com/services/…",
    helper: "Rendered as Slack blocks. Point it at an incoming webhook.",
  },
]

type ScopeMode = "all" | "specific"

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
  const queryClient = useQueryClient()
  const [url, setUrl] = React.useState("")
  const [events, setEvents] = React.useState<string[]>([])
  const [flavor, setFlavor] = React.useState<WebhookFlavor>("raw")
  const [scopeMode, setScopeMode] = React.useState<ScopeMode>("all")
  const [scopeLinks, setScopeLinks] = React.useState<string[]>([])
  const [description, setDescription] = React.useState("")
  const [newSecret, setNewSecret] = React.useState<string | null>(null)

  // Seed from the endpoint whenever the dialog opens in edit mode.
  React.useEffect(() => {
    if (!open) return
    if (mode === "edit" && endpoint) {
      setUrl(endpoint.url)
      setEvents(endpoint.events)
      setFlavor(endpoint.flavor)
      setScopeMode(endpoint.scope_links ? "specific" : "all")
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

  const reset = () => {
    setUrl("")
    setEvents([])
    setFlavor("raw")
    setScopeMode("all")
    setScopeLinks([])
    setDescription("")
  }

  const save = useMutation({
    mutationFn: () => {
      const scope = scopeMode === "specific" ? { scope_links: scopeLinks } : {}
      if (mode === "create")
        return createWebhook({
          url: url.trim(),
          events,
          flavor,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...scope,
        })
      return updateWebhook(endpoint!.id, {
        url: url.trim(),
        events,
        flavor,
        description: description.trim() || null,
        scope_links: scopeMode === "specific" ? scopeLinks : null,
      })
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
      if (mode === "create" && "signing_secret" in saved) {
        setNewSecret(saved.signing_secret as string)
        reset()
      } else {
        onOpenChange(false)
        toast.success("Endpoint updated")
      }
    },
    onError: (e) =>
      toast.error(
        e instanceof Error ? e.message : "Couldn't save the endpoint"
      ),
  })

  const flavorInfo =
    FLAVOR_OPTIONS.find((f) => f.token === flavor) ?? FLAVOR_OPTIONS[0]
  const valid =
    /^https:\/\/.+/.test(url.trim()) &&
    events.length > 0 &&
    (scopeMode === "all" || scopeLinks.length > 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setNewSecret(null)
          reset()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {newSecret ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your signing secret now</DialogTitle>
              <DialogDescription>
                This is the only time the full secret is shown. You need it to
                verify webhook signatures.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
              <code className="ph-no-capture min-w-0 flex-1 truncate font-mono text-foreground text-xs">
                {newSecret}
              </code>
              <CopyButton value={newSecret} trackAs="copy_webhook_secret" />
            </div>
            <div className="flex items-start gap-2 text-muted-foreground text-xs">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              Anyone with this secret can forge signed deliveries. It&apos;s
              shown once; delete the endpoint if it leaks.
            </div>
            <DialogFooter>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "New endpoint" : "Edit endpoint"}
              </DialogTitle>
              <DialogDescription>
                Point it at an HTTPS endpoint and pick the events it should
                receive.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="font-medium text-foreground text-xs">
                  URL
                </Label>
                <Input
                  autoFocus={mode === "create"}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={flavorInfo.placeholder}
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
                      Loading event types…
                    </div>
                  ) : (
                    subscribable.map((spec) => (
                      <label
                        key={spec.type}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2"
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
                        <span className="w-28 shrink-0 font-mono text-foreground text-xs">
                          {spec.type}
                        </span>
                        <span className="truncate text-muted-foreground text-xs">
                          {spec.description}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-foreground text-xs">
                  Flavor
                </Label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {FLAVOR_OPTIONS.map((f) => (
                    <button
                      key={f.token}
                      type="button"
                      onClick={() => setFlavor(f.token)}
                      className={cn(
                        "h-8 rounded-lg border px-2.5 text-xs transition-colors duration-150",
                        flavor === f.token
                          ? "border-border bg-accent/70 text-foreground"
                          : "border-border/60 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground/70 text-xs">
                  {flavorInfo.helper}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-foreground text-xs">
                  Links
                </Label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { token: "all", label: "All links" },
                      { token: "specific", label: "Specific links" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.token}
                      type="button"
                      onClick={() => setScopeMode(s.token)}
                      className={cn(
                        "h-8 rounded-lg border px-2.5 text-xs transition-colors duration-150",
                        scopeMode === s.token
                          ? "border-border bg-accent/70 text-foreground"
                          : "border-border/60 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {scopeMode === "specific" ? (
                  <LinkScopePicker
                    value={scopeLinks}
                    onChange={setScopeLinks}
                  />
                ) : (
                  <p className="text-muted-foreground/70 text-xs">
                    Applies to every link, including ones created later.
                  </p>
                )}
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
        )}
      </DialogContent>
    </Dialog>
  )
}
