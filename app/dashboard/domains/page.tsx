"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronRight, Globe, Plus } from "lucide-react"
import { toast } from "sonner"

import { createCustomDomain, listCustomDomains, SpooApiError } from "@/lib/api"
import { formatWhen } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { StatusPill } from "@/components/dashboard/status-pill"

export default function DomainsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = React.useState(false)
  const [fqdn, setFqdn] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const domains = useQuery({ queryKey: ["domains"], queryFn: listCustomDomains })

  const create = useMutation({
    mutationFn: () => createCustomDomain(fqdn.trim().toLowerCase()),
    onSuccess: (dom) => {
      queryClient.invalidateQueries({ queryKey: ["domains"] })
      setAddOpen(false)
      setFqdn("")
      toast.success("Domain registered", { description: dom.fqdn })
      router.push(`/dashboard/domains/${dom.id}`)
    },
    onError: (err) => {
      setError(err instanceof SpooApiError ? err.message : "Couldn't register the domain")
    },
  })

  const items = domains.data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="label-mono text-muted-foreground/60">Domains</span>
          <h1 className="text-foreground mt-2 text-xl font-semibold tracking-tight">
            Custom domains
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Serve short links from your own domain, with per-domain routing.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus data-icon="inline-start" />
          Add domain
        </Button>
      </div>

      <Panel className="mt-6">
        {domains.isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !items.length ? (
          <div className="pattern-dots m-4 flex h-48 flex-col items-center justify-center gap-3 rounded-lg">
            <span className="border-border text-muted-foreground/70 rounded-lg border border-dashed px-3 py-1.5 font-mono text-[11px]">
              no custom domains yet
            </span>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus data-icon="inline-start" />
              Add your first domain
            </Button>
          </div>
        ) : (
          <ul className="divide-border/60 divide-y">
            {items.map((dom) => (
              <li key={dom.id}>
                <Link
                  href={`/dashboard/domains/${dom.id}`}
                  className="hover:bg-accent/40 flex h-14 items-center gap-3 px-4 transition-colors duration-150"
                >
                  <span className="border-border/60 bg-muted/30 flex size-8 shrink-0 items-center justify-center rounded-lg border">
                    <Globe className="text-muted-foreground size-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate font-mono text-sm font-medium">
                      {dom.fqdn}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {dom.status === "ACTIVE"
                        ? `verified ${formatWhen(dom.last_verified_at)}`
                        : `added ${formatWhen(dom.created_at)}`}
                    </span>
                  </span>
                  <StatusPill status={dom.status} kind="domain" />
                  <ChevronRight className="text-muted-foreground/50 size-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); setError(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a custom domain</DialogTitle>
            <DialogDescription>
              A subdomain works best, like go.yourdomain.com. You&apos;ll point
              DNS at spoo.me in the next step.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Input
              autoFocus
              value={fqdn}
              onChange={(e) => { setFqdn(e.target.value); setError(null) }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && fqdn.trim()) create.mutate()
              }}
              placeholder="go.yourdomain.com"
              spellCheck={false}
              className="h-9 font-mono text-xs"
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              size="sm"
              disabled={!fqdn.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Registering…" : "Register domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
