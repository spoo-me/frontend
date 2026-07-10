"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpRight,
  BookOpen,
  KeyRound,
  Plus,
  ShieldOff,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import { trackApiKeyCreated, trackApiKeyDeleted } from "@/lib/analytics"
import {
  API_KEY_SCOPES,
  createApiKey,
  deleteApiKey,
  listApiKeys,
  type ApiKey,
} from "@/lib/api"
import { formatWhen } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DateTimeField } from "@/components/dashboard/date-time-field"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Ellipsis } from "lucide-react"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { CopyButton } from "@/components/dashboard/copy-button"
import { SCOPE_INFO, scopeMeaning } from "@/components/dashboard/scopes"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Superuser scope: implies everything, so picking it locks the rest. */
const ADMIN_SCOPE = "admin:all"

const KEY_EXPIRY_PRESETS = [
  { token: "never", label: "No expiry", days: null },
  { token: "7d", label: "7 days", days: 7 },
  { token: "30d", label: "30 days", days: 30 },
  { token: "90d", label: "90 days", days: 90 },
  { token: "1y", label: "1 year", days: 365 },
  { token: "custom", label: "Custom", days: null },
] as const

function KeyRow({ apiKey }: { apiKey: ApiKey }) {
  const queryClient = useQueryClient()
  const act = useMutation({
    mutationFn: (revoke: boolean) => deleteApiKey(apiKey.id, revoke),
    onSuccess: (_, revoke) => {
      trackApiKeyDeleted(revoke ? "revoke" : "delete")
      queryClient.invalidateQueries({ queryKey: ["keys"] })
      toast.success(revoke ? "Key revoked" : "Key deleted")
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update key"),
  })

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        apiKey.revoked && "opacity-55",
      )}
    >
      <span className="border-border/60 bg-muted/30 flex size-9 shrink-0 items-center justify-center rounded-lg border">
        <KeyRound className="text-foreground size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-medium">{apiKey.name}</span>
          {apiKey.revoked && (
            <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-[10px] font-medium">
              revoked
            </span>
          )}
        </div>
        <div className="text-muted-foreground truncate font-mono text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{apiKey.token_prefix}…</span>
            </TooltipTrigger>
            <TooltipContent>
              The first characters of the key, so you can tell keys apart. The
              full key is only shown once.
            </TooltipContent>
          </Tooltip>{" "}
          <span className="font-sans">
            · created {formatWhen(apiKey.created_at)} · last used{" "}
            {formatWhen(apiKey.last_used_at)}
            {apiKey.expires_at && (
              <>
                {" "}
                · expires{" "}
                {new Date(apiKey.expires_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </>
            )}
          </span>
        </div>
      </div>
      <div className="hidden items-center gap-1 md:flex">
        {apiKey.scopes.map((s) => {
          const chip = (
            <span className="border-border/60 bg-muted/40 text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-[10px]">
              {s}
            </span>
          )
          const meaning = scopeMeaning(s)
          return meaning ? (
            <Tooltip key={s}>
              <TooltipTrigger asChild>{chip}</TooltipTrigger>
              <TooltipContent>{meaning}</TooltipContent>
            </Tooltip>
          ) : (
            <React.Fragment key={s}>{chip}</React.Fragment>
          )
        })}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${apiKey.name}`}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          {!apiKey.revoked && (
            <DropdownMenuItem onSelect={() => act.mutate(true)}>
              <ShieldOff />
              Revoke (keep listed)
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onSelect={() => act.mutate(false)}>
            <Trash2 />
            Delete permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function DeveloperPage() {
  const queryClient = useQueryClient()
  const keys = useQuery({ queryKey: ["keys"], queryFn: listApiKeys })

  const [createOpen, setCreateOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [scopes, setScopes] = React.useState<string[]>(["shorten:create"])
  const [expiry, setExpiry] = React.useState<string>("never")
  const [customExpiry, setCustomExpiry] = React.useState("")
  const [newToken, setNewToken] = React.useState<string | null>(null)

  const adminAll = scopes.includes(ADMIN_SCOPE)
  // What was selected before admin:all took over, so unchecking restores it.
  const preAdminScopes = React.useRef<string[]>(["shorten:create"])
  const expiresAt = React.useMemo(() => {
    if (expiry === "never") return undefined
    if (expiry === "custom")
      return customExpiry ? new Date(customExpiry).toISOString() : undefined
    const days = KEY_EXPIRY_PRESETS.find((p) => p.token === expiry)?.days
    return days ? new Date(Date.now() + days * 86_400_000).toISOString() : undefined
  }, [expiry, customExpiry])

  const resetForm = () => {
    setName("")
    setScopes(["shorten:create"])
    setExpiry("never")
    setCustomExpiry("")
  }

  const create = useMutation({
    mutationFn: () =>
      createApiKey({
        name: name.trim(),
        scopes,
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      }),
    onSuccess: (created) => {
      trackApiKeyCreated({ scopes, hasExpiry: !!expiresAt }, "developer")
      queryClient.invalidateQueries({ queryKey: ["keys"] })
      setNewToken(created.token)
      resetForm()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't create key"),
  })

  const items = keys.data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="label-mono text-muted-foreground/60">Developer</span>
          <h1 className="text-foreground mt-2 text-xl font-semibold tracking-tight">
            API keys
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Scoped keys for the spoo.me API. Keys are shown once, at creation.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          New key
        </Button>
      </div>

      <Panel className="mt-6">
        {keys.isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !items.length ? (
          <div className="pattern-dots m-4 flex h-40 flex-col items-center justify-center gap-3 rounded-lg">
            <span className="border-border text-muted-foreground/70 rounded-lg border border-dashed px-3 py-1.5 font-mono text-[11px]">
              No API keys yet
            </span>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Create your first key
            </Button>
          </div>
        ) : (
          <div className="divide-border/60 divide-y">
            {items.map((k) => (
              <KeyRow key={k.id} apiKey={k} />
            ))}
          </div>
        )}
      </Panel>

      {/* Docs pointer */}
      <div className="mt-8">
        <SectionHeader
          icon={KeyRound}
          title="Using your key"
          action={
            <Button asChild variant="outline" size="sm" className="h-7">
              <a
                href="https://docs.spoo.me/api-reference/authentication"
                target="_blank"
                rel="noreferrer"
              >
                <BookOpen data-icon="inline-start" />
                API reference
                <ArrowUpRight data-icon="inline-end" />
              </a>
            </Button>
          }
        />
        <Panel className="mt-2">
          <div className="border-border/60 bg-muted/30 flex h-9 items-center justify-between border-b px-3">
            <span className="text-muted-foreground font-mono text-[11px]">curl</span>
            <CopyButton
              value={`curl -X POST https://spoo.me/api/v1/shorten -H "Authorization: Bearer spoo_YOUR_KEY" -H "Content-Type: application/json" -d '{"long_url": "https://example.com"}'`}
            />
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
            {/* Hand-tokenized: one static snippet doesn't earn a highlighter
                dependency. Colors stay inside the accent lock (brand + live). */}
            <code>
              <span className="text-foreground font-medium">curl</span>{" "}
              <span className="text-muted-foreground">-X</span>{" "}
              <span className="text-brand">POST</span>{" "}
              <span className="text-foreground">
                https://spoo.me/api/v1/shorten
              </span>{" "}
              <span className="text-muted-foreground/60">\{"\n"}</span>
              {"  "}
              <span className="text-muted-foreground">-H</span>{" "}
              <span className="text-live">
                &quot;Authorization: Bearer{" "}
                <span className="text-foreground font-medium">
                  spoo_YOUR_KEY
                </span>
                &quot;
              </span>{" "}
              <span className="text-muted-foreground/60">\{"\n"}</span>
              {"  "}
              <span className="text-muted-foreground">-H</span>{" "}
              <span className="text-live">
                &quot;Content-Type: application/json&quot;
              </span>{" "}
              <span className="text-muted-foreground/60">\{"\n"}</span>
              {"  "}
              <span className="text-muted-foreground">-d</span>{" "}
              <span className="text-live">
                &apos;{"{"}&quot;long_url&quot;: &quot;https://example.com&quot;
                {"}"}&apos;
              </span>
            </code>
          </pre>
        </Panel>
      </div>

      {/* Create dialog with show-once token state */}
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v)
          if (!v) {
            setNewToken(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {newToken ? (
            <>
              <DialogHeader>
                <DialogTitle>Copy your key now</DialogTitle>
                <DialogDescription>
                  This is the only time the full key is shown. Store it somewhere
                  safe.
                </DialogDescription>
              </DialogHeader>
              <div className="border-border/60 bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2.5">
                <code className="ph-no-capture text-foreground min-w-0 flex-1 truncate font-mono text-xs">
                  {newToken}
                </code>
                <CopyButton value={newToken} />
              </div>
              <div className="text-muted-foreground flex items-start gap-2 text-xs">
                <TriangleAlert className="text-amber-600 mt-0.5 size-3.5 shrink-0 dark:text-amber-400" />
                Anyone with this key can act within its scopes. Revoke it here if
                it leaks.
              </div>
              <DialogFooter>
                <Button size="sm" onClick={() => setCreateOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>New API key</DialogTitle>
                <DialogDescription>
                  Name it after where it lives, and grant only the scopes it needs.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs font-medium">
                    Name
                  </Label>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. GitHub Actions"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs font-medium">
                    Scopes
                  </Label>
                  <div className="border-border/60 divide-border/60 divide-y overflow-hidden rounded-xl border">
                    {API_KEY_SCOPES.map((scope) => (
                      <label
                        key={scope}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-opacity duration-150",
                          adminAll && "pointer-events-none opacity-45",
                        )}
                      >
                        <Checkbox
                          checked={adminAll || scopes.includes(scope)}
                          disabled={adminAll}
                          onCheckedChange={(v) =>
                            setScopes(
                              v === true
                                ? [...scopes, scope]
                                : scopes.filter((s) => s !== scope),
                            )
                          }
                        />
                        <span className="text-foreground w-36 shrink-0 font-mono text-xs">
                          {scope}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {SCOPE_INFO[scope]}
                        </span>
                      </label>
                    ))}
                  </div>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors duration-150",
                      adminAll
                        ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-400/10"
                        : "border-border/60",
                    )}
                  >
                    <Checkbox
                      checked={adminAll}
                      onCheckedChange={(v) => {
                        if (v === true) {
                          preAdminScopes.current = scopes
                          setScopes([ADMIN_SCOPE])
                        } else {
                          setScopes(
                            preAdminScopes.current.length
                              ? preAdminScopes.current
                              : ["shorten:create"],
                          )
                        }
                      }}
                    />
                    <span className="text-foreground w-36 shrink-0 font-mono text-xs">
                      {ADMIN_SCOPE}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Full access, overrides all scopes
                    </span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs font-medium">
                    Expires
                  </Label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {KEY_EXPIRY_PRESETS.map((p) => (
                      <button
                        key={p.token}
                        type="button"
                        onClick={() => setExpiry(p.token)}
                        className={cn(
                          "h-8 rounded-lg border px-2.5 text-xs transition-colors duration-150",
                          expiry === p.token
                            ? "border-border bg-accent/70 text-foreground"
                            : "border-border/60 text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                    {expiry === "custom" && (
                      <DateTimeField
                        value={customExpiry}
                        onChange={setCustomExpiry}
                        placeholder="Pick date and time"
                        defaultOpen
                        className="h-8"
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground/70 text-xs">
                    {expiry === "never"
                      ? "The key works until you revoke it."
                      : "The key stops working after this and can't be renewed."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  size="sm"
                  disabled={
                    !name.trim() ||
                    !scopes.length ||
                    (expiry === "custom" && !customExpiry) ||
                    create.isPending
                  }
                  onClick={() => create.mutate()}
                >
                  {create.isPending ? "Creating…" : "Create key"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
