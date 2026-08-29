"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Plug2,
  TerminalSquare,
  Unplug,
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"

import { trackUiAction } from "@/lib/analytics"
import { listAppGrants, revokeAppGrant, type AppGrant } from "@/lib/api"
import {
  connectedApps,
  integrations,
  sdks,
  type ConnectedApp,
} from "@/lib/apps-data"
import { formatWhen } from "@/lib/format"
import { cn } from "@/lib/utils"
import { scopeMeaning } from "@/components/dashboard/scopes"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { IMAGE_ICONS } from "@/components/icons/image-icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CopyButton } from "@/components/dashboard/copy-button"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Grants → catalogue slugs, so connected rows share the brand tiles and
 *  already-connected apps drop out of the catalogue below. */
// Grants carry the backend registry key (config/apps.yaml) in `app`;
// catalogue slugs use the same namespace, so the join is exact.
const grantApp = (grant: AppGrant) =>
  connectedApps.find((a) => a.slug === grant.app) ?? null

/** Shipped apps first; unshipped sink to the bottom of the grid. */
const availableFirst = (list: ConnectedApp[]) => [
  ...list.filter((a) => a.status !== "soon"),
  ...list.filter((a) => a.status === "soon"),
]

/** Brand icon in its color on a chrome tile tinted from the same hue. */
function AppIconTile({
  app,
  className,
}: {
  app: ConnectedApp
  className?: string
}) {
  const Brand = BrandIcons[app.iconKey as BrandIconKey]
  const image = IMAGE_ICONS[app.iconKey]
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg border",
        className
      )}
      style={{
        color: app.color,
        backgroundColor: `color-mix(in oklch, ${app.color} 14%, transparent)`,
        borderColor: `color-mix(in oklch, ${app.color} 32%, transparent)`,
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-4" loading="lazy" />
      ) : Brand ? (
        <Brand className="size-4" />
      ) : (
        <Plug2 className="size-4" strokeWidth={1.75} />
      )}
    </span>
  )
}

function CatalogueCard({
  app,
  delay,
  onOpen,
}: {
  app: ConnectedApp
  delay: number
  onOpen: (app: ConnectedApp) => void
}) {
  const soon = app.status === "soon"
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay }}
      onClick={() => onOpen(app)}
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-4 text-left transition-colors duration-150",
        soon
          ? "border-border/60 border-dashed bg-transparent hover:bg-accent/20"
          : "border-border/60 bg-card hover:bg-accent/30"
      )}
    >
      <AppIconTile
        app={app}
        className={cn(soon && "opacity-55 saturate-[0.6]")}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-medium text-sm",
              soon ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {app.name}
          </span>
          <span className="rounded-md border border-border/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {app.category}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-muted-foreground text-xs">
          {app.tagline}
        </span>
      </span>
      {soon && (
        <span className="label-mono shrink-0 text-[10px] text-muted-foreground/50">
          soon
        </span>
      )}
    </motion.button>
  )
}

/** Quiet mono scope chip — same recipe as the catalogue category tag. */
const scopeChipClass =
  "rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"

function ScopeChip({
  label,
  tooltip,
}: {
  label: string
  tooltip?: React.ReactNode
}) {
  if (!tooltip)
    return <span className={cn(scopeChipClass, "cursor-default")}>{label}</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(scopeChipClass, "cursor-default")}>{label}</span>
      </TooltipTrigger>
      <TooltipContent align="end">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function GrantRow({ grant }: { grant: AppGrant }) {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const app = grantApp(grant)

  const revoke = useMutation({
    // Revoke keys on the grant document id (`grant_id` on the wire).
    mutationFn: () => revokeAppGrant(grant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] })
      toast.success(`${grant.app_name} disconnected`)
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't revoke"),
  })

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {app ? (
        <AppIconTile app={app} />
      ) : (
        // Registry-gone grant: no catalogue entry to borrow a brand tile
        // from, so a generic plug — still listed, it holds live tokens.
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
          <Plug2 className="size-4 text-foreground" strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground text-sm">
          {grant.app_name}
        </div>
        <div className="truncate text-muted-foreground text-xs">
          connected {formatWhen(grant.granted_at)} · last used{" "}
          {formatWhen(grant.last_used_at)}
        </div>
      </div>
      {/* Scopes are the render source; `permissions` only backs tooltips.
          An empty scope list is a legacy unrestricted grant, never "no
          access", so it gets one full-access chip in the same voice. */}
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        {grant.scopes.length === 0 ? (
          <ScopeChip
            label="Full access"
            tooltip={grant.permissions[0] ?? "Full access to your account"}
          />
        ) : (
          <>
            {grant.scopes.slice(0, 3).map((s) => (
              <ScopeChip key={s} label={s} tooltip={scopeMeaning(s)} />
            ))}
            {grant.scopes.length > 3 && (
              <ScopeChip
                label={`+${grant.scopes.length - 3}`}
                tooltip={
                  <ul className="max-w-64 space-y-1">
                    {grant.scopes.slice(3).map((s) => (
                      <li key={s}>{scopeMeaning(s) ?? s}</li>
                    ))}
                  </ul>
                }
              />
            )}
          </>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive dark:hover:bg-destructive/10"
      >
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
              variant="destructive"
              onClick={() => revoke.mutate()}
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
  const [detail, setDetail] = React.useState<ConnectedApp | null>(null)
  const [shot, setShot] = React.useState<number | null>(null)
  const shots = detail?.gallery ?? []
  const openDetail = (app: ConnectedApp) => {
    trackUiAction("app_explored", app.slug)
    setDetail(app)
  }

  // Connected apps stay in the catalogue: it carries the download links.
  const catalogue = availableFirst(integrations)
  const sdkList = availableFirst(sdks)

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <span className="label-mono text-muted-foreground/60">Apps</span>
      <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
        Connected apps
      </h1>
      <p className="mt-1 text-muted-foreground text-sm">
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
            <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
              Nothing connected yet
            </span>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {items.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.04,
                }}
              >
                <GrantRow grant={g} />
              </motion.div>
            ))}
          </div>
        )}
      </Panel>

      {/* Catalogue */}
      <div className="mt-10">
        <SectionHeader icon={Plug2} title="App catalogue" />
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {catalogue.map((app, i) => (
            <CatalogueCard
              key={app.slug}
              app={app}
              delay={0.1 + i * 0.03}
              onOpen={openDetail}
            />
          ))}
        </div>
      </div>

      {/* SDKs live below the apps: libraries, not installable products */}
      <div className="mt-10">
        <SectionHeader icon={TerminalSquare} title="SDKs" />
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sdkList.map((app, i) => (
            <CatalogueCard
              key={app.slug}
              app={app}
              delay={0.15 + i * 0.03}
              onOpen={openDetail}
            />
          ))}
        </div>
      </div>

      {/* App detail: what it is, gallery, features, setup */}
      <Dialog
        open={detail !== null}
        onOpenChange={(v) => !v && setDetail(null)}
      >
        <DialogContent className="sm:max-w-xl">
          {detail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <AppIconTile app={detail} className="size-11 rounded-xl" />
                  <div className="min-w-0">
                    <DialogTitle className="flex items-center gap-2">
                      {detail.name}
                      <span className="rounded-md border border-border/60 px-1.5 py-0.5 font-mono font-normal text-[10px] text-muted-foreground">
                        {detail.category}
                      </span>
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 truncate">
                      {detail.tagline}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {detail.gallery && detail.gallery.length > 0 && (
                <div className="flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
                  {detail.gallery.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setShot(i)}
                      className="shrink-0 cursor-zoom-in snap-start overflow-hidden rounded-lg border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Expand ${detail.name} screenshot`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${detail.name} screenshot`}
                        loading="lazy"
                        className="h-36 w-auto"
                      />
                    </button>
                  ))}
                </div>
              )}

              <p className="text-muted-foreground text-sm">
                {detail.description}
              </p>

              <div className="space-y-3">
                <span className="label-mono block text-muted-foreground/60">
                  Features
                </span>
                <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {detail.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-foreground text-xs"
                    >
                      <Check className="mt-0.5 size-3 shrink-0 text-live" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {detail.install && detail.install.length > 0 && (
                <div className="min-w-0 space-y-3">
                  <span className="label-mono block text-muted-foreground/60">
                    Setup
                  </span>
                  <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
                    {detail.install.map((step) => {
                      const copyable =
                        /^(npm|npx|pnpm|yarn|pip|pipx|uv|cargo|go |winget|brew|apt|docker|curl|git )/.test(
                          step.command
                        )
                      return (
                        <div
                          key={step.label}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <span className="w-36 shrink-0 text-muted-foreground text-xs">
                            {step.label}
                          </span>
                          <code className="min-w-0 flex-1 truncate font-mono text-foreground text-xs">
                            {step.command}
                          </code>
                          {copyable && <CopyButton value={step.command} />}
                        </div>
                      )
                    })}
                  </div>
                  {detail.installNotes && detail.installNotes.length > 0 && (
                    <ol className="list-decimal space-y-1 pl-4 text-muted-foreground text-xs leading-relaxed">
                      {detail.installNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              <DialogFooter>
                {detail.github && (
                  <Button asChild variant="outline" size="sm">
                    <a href={detail.github} target="_blank" rel="noreferrer">
                      <BrandIcons.github data-icon="inline-start" />
                      GitHub
                    </a>
                  </Button>
                )}
                {detail.status === "soon" ? (
                  <Button size="sm" disabled>
                    Coming soon
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <a href={detail.url} target="_blank" rel="noreferrer">
                      Get {detail.name}
                      <ArrowUpRight data-icon="inline-end" />
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Expanded screenshot, stacked over the detail dialog */}
      <Dialog open={shot !== null} onOpenChange={(v) => !v && setShot(null)}>
        <DialogContent
          showCloseButton
          className="w-[95vw] max-w-5xl bg-background p-2 sm:max-w-5xl"
        >
          <DialogTitle className="sr-only">
            {detail?.name} screenshot {shot !== null ? shot + 1 : ""} of{" "}
            {shots.length}
          </DialogTitle>
          {shot !== null && shots[shot] && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shots[shot]}
                alt={`${detail?.name} screenshot`}
                className="h-auto max-h-[85vh] w-full rounded-lg object-contain"
              />
              {shots.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setShot((shot - 1 + shots.length) % shots.length)
                    }
                    aria-label="Previous"
                    className="absolute top-1/2 left-2 -translate-y-1/2 bg-background/70 backdrop-blur hover:bg-background"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShot((shot + 1) % shots.length)}
                    aria-label="Next"
                    className="absolute top-1/2 right-2 -translate-y-1/2 bg-background/70 backdrop-blur hover:bg-background"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/70 px-2.5 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur">
                    {shot + 1} / {shots.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
