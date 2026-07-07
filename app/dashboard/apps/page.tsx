"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpRight,
  Command,
  Plug2,
  Puzzle,
  TerminalSquare,
  Unplug,
} from "lucide-react"
import { toast } from "sonner"

import { listAppGrants, revokeAppGrant, type AppGrant } from "@/lib/api"
import { connectedApps } from "@/lib/apps-data"
import { formatWhen } from "@/lib/format"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Panel, SectionHeader } from "@/components/dashboard/section"

const GRANT_ICONS: Record<string, React.ElementType> = {
  terminal: TerminalSquare,
  puzzle: Puzzle,
  command: Command,
}

function GrantRow({ grant }: { grant: AppGrant }) {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const Icon = GRANT_ICONS[grant.icon] ?? Plug2

  const revoke = useMutation({
    mutationFn: () => revokeAppGrant(grant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] })
      toast.success(`${grant.app_name} disconnected`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't revoke"),
  })

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="border-border/60 bg-muted/30 flex size-9 shrink-0 items-center justify-center rounded-lg border">
        <Icon className="text-foreground size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-foreground text-sm font-medium">{grant.app_name}</div>
        <div className="text-muted-foreground truncate text-xs">
          {grant.device} · last used {formatWhen(grant.last_used_at)}
        </div>
      </div>
      <div className="hidden items-center gap-1 sm:flex">
        {grant.scopes.slice(0, 3).map((s) => (
          <span
            key={s}
            className="border-border/60 bg-muted/40 text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-[10px]"
          >
            {s}
          </span>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
        <Unplug data-icon="inline-start" />
        Disconnect
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {grant.app_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The app loses access immediately. You can reconnect it any time by
              signing in from the app again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revoke.mutate()}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AppsPage() {
  const grants = useQuery({ queryKey: ["apps"], queryFn: listAppGrants })
  const items = grants.data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <span className="label-mono text-muted-foreground/60">Apps</span>
      <h1 className="text-foreground mt-2 text-xl font-semibold tracking-tight">
        Connected apps
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Devices and integrations with access to your account.
      </p>

      <Panel className="mt-6">
        {grants.isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !items.length ? (
          <div className="pattern-dots m-4 flex h-40 items-center justify-center rounded-lg">
            <span className="border-border text-muted-foreground/70 rounded-lg border border-dashed px-3 py-1.5 font-mono text-[11px]">
              nothing connected yet
            </span>
          </div>
        ) : (
          <div className="divide-border/60 divide-y">
            {items.map((g) => (
              <GrantRow key={g.id} grant={g} />
            ))}
          </div>
        )}
      </Panel>

      {/* Catalogue */}
      <div className="mt-10">
        <SectionHeader icon={Plug2} title="App catalogue" />
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {connectedApps.map((app) => {
            const Brand = BrandIcons[app.iconKey as BrandIconKey]
            return (
              <a
                key={app.slug}
                href={app.url}
                target="_blank"
                rel="noreferrer"
                className="group border-border/60 bg-card hover:bg-accent/30 flex items-start gap-3 rounded-xl border p-4 transition-colors duration-150"
              >
                <span className="border-border/60 bg-muted/30 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                  {Brand ? (
                    <Brand className="size-4" />
                  ) : (
                    <Plug2 className="text-muted-foreground size-4" strokeWidth={1.75} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-foreground text-sm font-medium">{app.name}</span>
                    <span className="border-border/60 text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-[10px]">
                      {app.category}
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
                    {app.tagline}
                  </span>
                </span>
                <ArrowUpRight className="text-muted-foreground/40 group-hover:text-foreground size-3.5 shrink-0 transition-colors duration-150" />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
