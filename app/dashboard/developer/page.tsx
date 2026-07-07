"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, Plus, ShieldOff, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

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
import { Checkbox } from "@/components/ui/checkbox"
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

function KeyRow({ apiKey }: { apiKey: ApiKey }) {
  const queryClient = useQueryClient()
  const act = useMutation({
    mutationFn: (revoke: boolean) => deleteApiKey(apiKey.id, revoke),
    onSuccess: (_, revoke) => {
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
          {apiKey.token_prefix}…{" "}
          <span className="font-sans">
            · created {formatWhen(apiKey.created_at)} · last used{" "}
            {formatWhen(apiKey.last_used_at)}
          </span>
        </div>
      </div>
      <div className="hidden items-center gap-1 md:flex">
        {apiKey.scopes.map((s) => (
          <span
            key={s}
            className="border-border/60 bg-muted/40 text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-[10px]"
          >
            {s}
          </span>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${apiKey.name}`}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
  const [newToken, setNewToken] = React.useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => createApiKey({ name: name.trim(), scopes }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["keys"] })
      setNewToken(created.token)
      setName("")
      setScopes(["shorten:create"])
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
              no api keys yet
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
        <SectionHeader icon={KeyRound} title="Using your key" />
        <Panel className="mt-2">
          <div className="border-border/60 bg-muted/30 flex h-9 items-center justify-between border-b px-3">
            <span className="text-muted-foreground font-mono text-[11px]">curl</span>
            <CopyButton
              value={`curl -X POST https://spoo.me/api/v1/shorten -H "Authorization: Bearer spoo_YOUR_KEY" -H "Content-Type: application/json" -d '{"long_url": "https://example.com"}'`}
            />
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
            <code>
              <span className="text-muted-foreground">curl -X POST</span>{" "}
              https://spoo.me/api/v1/shorten \{"\n"}
              {"  "}
              <span className="text-muted-foreground">-H</span>{" "}
              &quot;Authorization: Bearer spoo_YOUR_KEY&quot; \{"\n"}
              {"  "}
              <span className="text-muted-foreground">-H</span>{" "}
              &quot;Content-Type: application/json&quot; \{"\n"}
              {"  "}
              <span className="text-muted-foreground">-d</span>{" "}
              &apos;{"{"}&quot;long_url&quot;: &quot;https://example.com&quot;{"}"}&apos;
            </code>
          </pre>
        </Panel>
      </div>

      {/* Create dialog with show-once token state */}
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v)
          if (!v) setNewToken(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
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
                <code className="text-foreground min-w-0 flex-1 truncate font-mono text-xs">
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
              <div className="space-y-4">
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GitHub Actions"
                  className="h-9 text-sm"
                />
                <div className="space-y-1.5">
                  {API_KEY_SCOPES.map((scope) => (
                    <label
                      key={scope}
                      className="flex cursor-pointer items-center gap-2.5 text-sm"
                    >
                      <Checkbox
                        checked={scopes.includes(scope)}
                        onCheckedChange={(v) =>
                          setScopes(
                            v === true
                              ? [...scopes, scope]
                              : scopes.filter((s) => s !== scope),
                          )
                        }
                      />
                      <span className="font-mono text-xs">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  size="sm"
                  disabled={!name.trim() || !scopes.length || create.isPending}
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
