"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronRight, Globe, Plus } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"

import { trackDomainAdded } from "@/lib/analytics"
import { useFeatureGuard } from "@/hooks/use-features"
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
import { Panel } from "@/components/dashboard/section"
import { StatusPill } from "@/components/dashboard/status-pill"

export default function DomainsPage() {
  const router = useRouter()
  const domainsEnabled = useFeatureGuard("custom_domains", () =>
    router.replace("/dashboard")
  )
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = React.useState(false)
  const [fqdn, setFqdn] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
    enabled: domainsEnabled,
  })

  const create = useMutation({
    mutationFn: () => createCustomDomain(fqdn.trim().toLowerCase()),
    onSuccess: (dom) => {
      trackDomainAdded()
      queryClient.invalidateQueries({ queryKey: ["domains"] })
      setAddOpen(false)
      setFqdn("")
      toast.success("Domain registered", { description: dom.fqdn })
      router.push(`/dashboard/domains/${dom.id}`)
    },
    onError: (err) => {
      setError(
        err instanceof SpooApiError
          ? err.message
          : "Couldn't register the domain"
      )
    },
  })

  const items = domains.data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="label-mono text-muted-foreground/60">Domains</span>
          <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
            Custom domains
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
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
            <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
              No custom domains yet
            </span>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus data-icon="inline-start" />
              Add your first domain
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((dom, i) => (
              <motion.li
                key={dom.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.04,
                }}
              >
                <Link
                  href={`/dashboard/domains/${dom.id}`}
                  className="flex h-14 items-center gap-3 px-4 transition-colors duration-150 hover:bg-accent/40"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                    <Globe
                      className="size-4 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium font-mono text-foreground text-sm">
                      {dom.fqdn}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {dom.status === "ACTIVE"
                        ? `verified ${formatWhen(dom.last_verified_at)}`
                        : `added ${formatWhen(dom.created_at)}`}
                    </span>
                  </span>
                  <StatusPill status={dom.status} kind="domain" explain />
                  <ChevronRight className="size-4 text-muted-foreground/50" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v)
          setError(null)
        }}
      >
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
              onChange={(e) => {
                setFqdn(e.target.value)
                setError(null)
              }}
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
