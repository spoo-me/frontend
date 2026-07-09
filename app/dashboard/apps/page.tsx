"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpRight,
  Check,
  Command,
  Plug2,
  Puzzle,
  TerminalSquare,
  Unplug,
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"

import { listAppGrants, revokeAppGrant, type AppGrant } from "@/lib/api"
import {
  connectedApps,
  integrations,
  sdks,
  type ConnectedApp,
} from "@/lib/apps-data"
import { formatWhen } from "@/lib/format"
import { cn } from "@/lib/utils"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
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

const GRANT_ICONS: Record<string, React.ElementType> = {
  terminal: TerminalSquare,
  puzzle: Puzzle,
  command: Command,
}

/** Grants → catalogue slugs, so connected rows share the brand tiles and
 *  already-connected apps drop out of the catalogue below. */
const GRANT_APP_SLUGS: Record<string, string> = {
  terminal: "cli",
  puzzle: "chrome",
  command: "raycast",
}

const grantApp = (grant: AppGrant) =>
  connectedApps.find((a) => a.slug === GRANT_APP_SLUGS[grant.icon]) ?? null

/** Shipped apps first; unshipped sink to the bottom of the grid. */
const availableFirst = (list: ConnectedApp[]) => [
  ...list.filter((a) => a.status !== "soon"),
  ...list.filter((a) => a.status === "soon"),
]

/** Multicolor official logos where a single-hue glyph reads wrong. */
const IMAGE_ICONS: Record<string, string> = {
  chrome:
    "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/chrome/chrome_64x64.png",
  python:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
}

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
        className,
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
          ? "border-border/60 hover:bg-accent/20 border-dashed bg-transparent"
          : "border-border/60 bg-card hover:bg-accent/30",
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
              "text-sm font-medium",
              soon ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {app.name}
          </span>
          <span className="border-border/60 text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-[10px]">
            {app.category}
          </span>
        </span>
        <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
          {app.tagline}
        </span>
      </span>
      {soon && (
        <span className="label-mono text-muted-foreground/50 shrink-0 text-[10px]">
          soon
        </span>
      )}
    </motion.button>
  )
}

function GrantRow({ grant }: { grant: AppGrant }) {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const Icon = GRANT_ICONS[grant.icon] ?? Plug2
  const app = grantApp(grant)

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
      {app ? (
        <AppIconTile app={app} />
      ) : (
        <span className="border-border/60 bg-muted/30 flex size-9 shrink-0 items-center justify-center rounded-lg border">
          <Icon className="text-foreground size-4" strokeWidth={1.75} />
        </span>
      )}
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10"
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

  // Connected apps leave the catalogue; what remains sorts available-first.
  const connectedSlugs = new Set(
    items.map((g) => grantApp(g)?.slug).filter(Boolean),
  )
  const catalogue = availableFirst(
    integrations.filter((a) => !connectedSlugs.has(a.slug)),
  )
  const sdkList = availableFirst(sdks)

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
            {items.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
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
              onOpen={setDetail}
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
              onOpen={setDetail}
            />
          ))}
        </div>
      </div>

      {/* App detail: what it is, gallery, features, setup */}
      <Dialog open={detail !== null} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-xl">
          {detail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <AppIconTile app={detail} className="size-11 rounded-xl" />
                  <div className="min-w-0">
                    <DialogTitle className="flex items-center gap-2">
                      {detail.name}
                      <span className="border-border/60 text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-normal">
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
                <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
                  {detail.gallery.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt={`${detail.name} screenshot`}
                      loading="lazy"
                      className="border-border/60 h-36 shrink-0 snap-start rounded-lg border object-cover"
                    />
                  ))}
                </div>
              )}

              <p className="text-muted-foreground text-sm">{detail.description}</p>

              <div className="space-y-3">
                <span className="label-mono text-muted-foreground/60 block">
                  Features
                </span>
                <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {detail.features.map((f) => (
                    <li
                      key={f}
                      className="text-foreground flex items-start gap-2 text-xs"
                    >
                      <Check className="text-live mt-0.5 size-3 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {detail.install && detail.install.length > 0 && (
                <div className="space-y-3">
                  <span className="label-mono text-muted-foreground/60 block">
                    Setup
                  </span>
                  <div className="border-border/60 divide-border/60 divide-y overflow-hidden rounded-xl border">
                    {detail.install.map((step) => {
                      const copyable =
                        /^(npm|npx|pnpm|yarn|pip|pipx|uv|cargo|go |winget|brew|apt|docker|curl|git )/.test(
                          step.command,
                        )
                      return (
                        <div
                          key={step.label}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <span className="text-muted-foreground w-36 shrink-0 text-xs">
                            {step.label}
                          </span>
                          <code className="text-foreground min-w-0 flex-1 truncate font-mono text-xs">
                            {step.command}
                          </code>
                          {copyable && <CopyButton value={step.command} />}
                        </div>
                      )
                    })}
                  </div>
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
    </div>
  )
}
