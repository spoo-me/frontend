"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Check,
  Globe,
  LoaderCircle,
  Plus,
  Route,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { trackDomainVerified } from "@/lib/analytics"
import { useFeatureGuard } from "@/hooks/use-features"
import {
  getCustomDomain,
  revokeCustomDomain,
  updateCustomDomain,
  verifyCustomDomain,
  type CustomDomain,
  type DnsRecord,
} from "@/lib/api"
import { formatWhen } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
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
import { InfoHint } from "@/components/dashboard/info-hint"
import { StatusPill } from "@/components/dashboard/status-pill"
import { CopyButton } from "@/components/dashboard/copy-button"
import { openLinkComposer } from "@/components/dashboard/links/composer"

/**
 * Domain setup as a vertical rail. The step you're on is a pure function of
 * server `status`, so it survives refreshes by construction (SPEC §2). Every
 * step's content stays mounted while setting up; only the markers advance.
 */

type StepState = "done" | "current" | "todo"

function stepIndex(status: CustomDomain["status"]): number {
  switch (status) {
    case "PENDING":
      return 1
    // The backend never emits VERIFYING today (verify goes PENDING → ACTIVE
    // in one hop); kept renderable for future async verification flows.
    case "VERIFYING":
      return 2
    case "ACTIVE":
      return 3
    default:
      return 0
  }
}

function stateOf(i: number, current: number): StepState {
  return i < current ? "done" : i === current ? "current" : "todo"
}

function StepMarker({ state, n }: { state: StepState; n: number }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors duration-300",
        state === "done" && "border-live/30 bg-live/10 text-live",
        state === "current" && "border-foreground/30 bg-card text-foreground",
        state === "todo" &&
          "border-border border-dashed text-muted-foreground/50"
      )}
    >
      {state === "done" ? <Check className="size-3" /> : `0${n}`}
    </span>
  )
}

function SetupStep({
  n,
  state,
  label,
  meta,
  last,
  children,
}: {
  n: number
  state: StepState
  label: string
  meta?: React.ReactNode
  last?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-4">
      <div className="flex flex-col items-center">
        <StepMarker state={state} n={n} />
        {!last && (
          <span
            aria-hidden
            className={cn(
              "my-1 w-px flex-1 transition-colors duration-300",
              state === "done" ? "bg-live/25" : "bg-border/70"
            )}
          />
        )}
      </div>
      <div className={cn("min-w-0", !last && "pb-8")}>
        <div className="flex h-6 items-center justify-between gap-3">
          <span
            className={cn(
              "label-mono transition-colors duration-300",
              state === "current"
                ? "text-foreground"
                : state === "done"
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
            )}
          >
            {label}
          </span>
          {meta}
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}

function StepMeta({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
      {children}
    </span>
  )
}

/** Type / Name / Value, each field copyable — mirrors what registrars ask for. */
function CopyCell({ value }: { value: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="truncate font-mono text-foreground text-xs">
        {value}
      </span>
      <CopyButton
        value={value}
        trackAs="copy_dns_record"
        className="size-5 [&_svg]:size-3"
      />
    </span>
  )
}

function DnsRecordsTable({ records }: { records: DnsRecord[] }) {
  return (
    <Panel>
      <div className="hidden h-9 grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 border-border/60 border-b px-4 sm:grid">
        <span className="label-mono text-muted-foreground/60">Type</span>
        <span className="label-mono text-muted-foreground/60">Name</span>
        <span className="flex items-center justify-between gap-1.5">
          <span className="label-mono text-muted-foreground/60">Value</span>
          <InfoHint label="About these DNS records">
            Add these at your DNS provider exactly as shown.
          </InfoHint>
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {records.map((rec) => (
          <div
            key={rec.type + rec.name}
            className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 gap-y-1.5 px-4 py-3.5 sm:grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
          >
            <span className="self-center font-mono text-[11px] text-muted-foreground">
              {rec.type}
            </span>
            <CopyCell value={rec.name} />
            <span className="sm:hidden" aria-hidden />
            <CopyCell value={rec.value} />
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Enter({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
    >
      {children}
    </motion.div>
  )
}

export default function DomainDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const domainsEnabled = useFeatureGuard("custom_domains", () =>
    router.replace("/dashboard")
  )
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [cascade, setCascade] = React.useState(false)

  const domain = useQuery({
    queryKey: ["domains", params.id],
    queryFn: () => getCustomDomain(params.id),
    enabled: domainsEnabled,
  })
  const dom = domain.data

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["domains"] })
  }

  const verify = useMutation({
    mutationFn: () => verifyCustomDomain(params.id),
    onSuccess: (next) => {
      // Emit only on the PENDING → ACTIVE flip, not on re-verifies.
      if (next.status === "ACTIVE" && dom?.status !== "ACTIVE")
        trackDomainVerified(
          next.created_at
            ? Math.max(
                0,
                Math.round(
                  (Date.now() - new Date(next.created_at).getTime()) /
                    86_400_000
                )
              )
            : null
        )
      invalidate()
      queryClient.setQueryData(["domains", params.id], next)
      if (next.status === "ACTIVE") toast.success(`${next.fqdn} is live`)
      else if (next.last_verification_error)
        toast.info("Not verified yet", {
          description: next.last_verification_error,
        })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Verification failed"),
  })

  const [rootRedirect, setRootRedirect] = React.useState<string | null>(null)
  const [notFound, setNotFound] = React.useState<string | null>(null)
  const [robots, setRobots] = React.useState<string | null>(null)
  const routingDirty =
    dom &&
    ((rootRedirect !== null && rootRedirect !== (dom.root_redirect ?? "")) ||
      (notFound !== null && notFound !== (dom.not_found_redirect ?? "")) ||
      (robots !== null && robots !== (dom.custom_robots_txt ?? "")))

  const saveRouting = useMutation({
    mutationFn: () =>
      updateCustomDomain(params.id, {
        ...(rootRedirect !== null
          ? { root_redirect: rootRedirect || null }
          : {}),
        ...(notFound !== null ? { not_found_redirect: notFound || null } : {}),
        ...(robots !== null ? { custom_robots_txt: robots || null } : {}),
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(["domains", params.id], next)
      setRootRedirect(null)
      setNotFound(null)
      setRobots(null)
      toast.success("Routing updated")
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't save"),
  })

  const revoke = useMutation({
    mutationFn: () => revokeCustomDomain(params.id, cascade),
    onSuccess: () => {
      invalidate()
      toast.success("Domain revoked")
      router.push("/dashboard/domains")
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't revoke"),
  })

  if (domain.isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-7 w-64" />
        <Skeleton className="mt-2.5 h-3.5 w-44" />
        <div className="mt-8 grid grid-cols-[24px_minmax(0,1fr)] gap-x-4 gap-y-8">
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className={cn("w-full", i === 1 ? "h-32" : "h-6")} />
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }
  if (!dom) return null

  const current = stepIndex(dom.status)
  const settingUp = dom.status === "PENDING" || dom.status === "VERIFYING"
  // The shipping path: Cloudflare runs the checks and issues TLS on its own.
  const httpDcv = dom.verification_method === "cf_http_dcv"

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <div>
        <Link
          href="/dashboard/domains"
          className="label-mono inline-flex items-center gap-1.5 text-muted-foreground/60 transition-colors duration-150 hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Domains
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <h1 className="truncate font-mono font-semibold text-foreground text-xl tracking-tight">
            {dom.fqdn}
          </h1>
          <StatusPill status={dom.status} kind="domain" explain />
          {dom.status === "ACTIVE" && (
            <Button
              variant="outline"
              // When the row wraps (phones) the button joins the content
              // flow left-aligned instead of floating off the right edge.
              className="ml-auto max-sm:ml-0"
              onClick={() => openLinkComposer({ domain: dom.fqdn })}
            >
              <Plus data-icon="inline-start" />
              Use this domain
            </Button>
          )}
        </div>
        <p className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
          <span>added {formatWhen(dom.created_at)}</span>
          {dom.status === "ACTIVE" && (
            <>
              <span aria-hidden>·</span>
              <span>verified {formatWhen(dom.last_verified_at)}</span>
            </>
          )}
        </p>
      </div>

      {/* Setup rail: PENDING / VERIFYING */}
      {settingUp && (
        <div className="mt-8">
          <Enter i={0}>
            <SetupStep
              n={1}
              state={stateOf(0, current)}
              label="Register domain"
              meta={
                <StepMeta>registered {formatWhen(dom.created_at)}</StepMeta>
              }
            />
          </Enter>
          <Enter i={1}>
            <SetupStep
              n={2}
              state={stateOf(1, current)}
              label="Point DNS at spoo.me"
              meta={<StepMeta>{dom.dns_records.length} records</StepMeta>}
            >
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">
                  {dom.dns_records.length === 1
                    ? "Add this record at your DNS provider."
                    : "Add these records at your DNS provider."}
                </p>
                <DnsRecordsTable records={dom.dns_records} />
                {dom.setup_notes.map((note) => (
                  <p
                    key={note}
                    className="text-[11px] text-muted-foreground/60"
                  >
                    {note}
                  </p>
                ))}
              </div>
            </SetupStep>
          </Enter>
          <Enter i={2}>
            <SetupStep
              n={3}
              state={stateOf(2, current)}
              label={httpDcv ? "Verify & issue TLS" : "Verify ownership"}
            >
              <div className="space-y-2.5">
                <p className="text-muted-foreground text-xs">
                  {httpDcv
                    ? "The CNAME routes traffic and the TXT proves ownership. Verification and TLS complete automatically once the records resolve."
                    : "We confirm the records and provision TLS at the edge."}
                </p>
                {dom.last_verification_error && (
                  <p className="flex items-start gap-1.5 text-amber-700 text-xs dark:text-amber-400">
                    <TriangleAlert className="mt-px size-3.5 shrink-0" />
                    {dom.last_verification_error}
                  </p>
                )}
                <div className="pt-1">
                  <Button
                    disabled={verify.isPending}
                    onClick={() => verify.mutate()}
                  >
                    {verify.isPending && (
                      <LoaderCircle
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    )}
                    {dom.last_verification_error
                      ? "Check again"
                      : "Start verification"}
                  </Button>
                </div>
              </div>
            </SetupStep>
          </Enter>
          <Enter i={3}>
            <SetupStep n={4} state={stateOf(3, current)} label="Go live" last>
              <p className="text-muted-foreground/60 text-xs">
                Links on {dom.fqdn} start resolving once checks pass.
              </p>
            </SetupStep>
          </Enter>
        </div>
      )}

      {/* Live: routing config + DNS reference */}
      {dom.status === "ACTIVE" && (
        <>
          <Enter i={0}>
            <div className="mt-8">
              <SectionHeader
                icon={Route}
                title="Routing"
                action={
                  <div
                    inert={!routingDirty}
                    className={cn(
                      "transition-opacity duration-150",
                      routingDirty
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                    )}
                  >
                    <Button
                      disabled={saveRouting.isPending}
                      onClick={() => saveRouting.mutate()}
                    >
                      {saveRouting.isPending && (
                        <LoaderCircle
                          data-icon="inline-start"
                          className="animate-spin"
                        />
                      )}
                      Save routing
                    </Button>
                  </div>
                }
              />
              <Panel className="mt-2">
                <div className="space-y-5 p-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="domain-root-redirect"
                        className="mb-2.5 block font-medium text-foreground text-xs"
                      >
                        Root redirect
                      </label>
                      <Input
                        id="domain-root-redirect"
                        value={rootRedirect ?? dom.root_redirect ?? ""}
                        onChange={(e) => setRootRedirect(e.target.value)}
                        placeholder={`Where ${dom.fqdn}/ goes`}
                        spellCheck={false}
                        className="font-mono text-xs"
                      />
                      <p className="text-muted-foreground/70 text-xs">
                        Visitors hitting the bare domain get sent here. Blank
                        serves a 404.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="domain-not-found-redirect"
                        className="mb-2.5 block font-medium text-foreground text-xs"
                      >
                        Not-found redirect
                      </label>
                      <Input
                        id="domain-not-found-redirect"
                        value={notFound ?? dom.not_found_redirect ?? ""}
                        onChange={(e) => setNotFound(e.target.value)}
                        placeholder="Where unknown aliases go"
                        spellCheck={false}
                        className="font-mono text-xs"
                      />
                      <p className="text-muted-foreground/70 text-xs">
                        Fallback for typos and missing aliases. Blank serves a
                        404.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="mb-2.5 flex items-center justify-between">
                      <label
                        htmlFor="domain-robots-txt"
                        className="font-medium text-foreground text-xs"
                      >
                        Custom robots.txt
                      </label>
                      <span className="font-mono text-[11px] text-muted-foreground/60 tabular-nums">
                        {(robots ?? dom.custom_robots_txt ?? "").length} / 4096
                      </span>
                    </div>
                    <Textarea
                      id="domain-robots-txt"
                      value={robots ?? dom.custom_robots_txt ?? ""}
                      onChange={(e) => setRobots(e.target.value)}
                      placeholder={"User-agent: *\nDisallow: /"}
                      spellCheck={false}
                      maxLength={4096}
                      className="min-h-24 font-mono text-xs"
                    />
                    <p className="text-muted-foreground/70 text-xs">
                      Served at {dom.fqdn}/robots.txt. Blank serves the default,
                      which blocks all crawlers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border-border/60 border-t bg-muted/30 px-5 py-3">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
                  <p className="text-muted-foreground text-xs">
                    Redirects send visitors to whatever you configure here.
                    Phishing or other abuse gets the domain revoked.
                  </p>
                </div>
              </Panel>
            </div>
          </Enter>
          <Enter i={1}>
            <div className="mt-8">
              <SectionHeader icon={Globe} title="DNS records" />
              <div className="mt-2">
                <DnsRecordsTable records={dom.dns_records} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground/60">
                Keep these records in place. Removing them takes the domain
                offline.
              </p>
            </div>
          </Enter>
        </>
      )}

      {/* Suspended: explain, keep the revoke escape hatch below */}
      {dom.status === "SUSPENDED" && (
        <Enter i={0}>
          <Panel className="mt-8 border-amber-500/25 p-4">
            <div className="flex gap-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
              <div className="space-y-1">
                <div className="font-medium text-foreground text-sm">
                  Domain suspended
                </div>
                <p className="text-muted-foreground text-xs">
                  Links on {dom.fqdn} stop resolving while suspended. Your links
                  and their stats are kept. Reach out on Discord if you think
                  this is a mistake.
                </p>
              </div>
            </div>
          </Panel>
        </Enter>
      )}

      {/* Revoked: terminal state */}
      {dom.status === "REVOKED" && (
        <Enter i={0}>
          <Panel className="mt-8">
            <div className="pattern-dots m-4 flex h-44 flex-col items-center justify-center gap-3 rounded-lg">
              <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
                domain revoked
              </span>
              <p className="max-w-sm text-center text-muted-foreground text-xs">
                Links on {dom.fqdn} stopped resolving. Revocation is terminal.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/domains">Back to domains</Link>
              </Button>
            </div>
          </Panel>
        </Enter>
      )}

      {/* Danger zone */}
      {dom.status !== "REVOKED" && (
        <Enter i={settingUp ? 4 : 2}>
          <div className="mt-8">
            <SectionHeader icon={ShieldAlert} title="Danger zone" />
            <Panel className="mt-2 flex flex-wrap items-center justify-between gap-3 border-destructive/20 p-4">
              <div>
                <div className="font-medium text-foreground text-sm">
                  Revoke this domain
                </div>
                <div className="text-muted-foreground text-xs">
                  Links on {dom.fqdn} stop resolving. Revocation is terminal.
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                Revoke domain
              </Button>
            </Panel>
          </div>
        </Enter>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {dom.fqdn}?</AlertDialogTitle>
            <AlertDialogDescription>
              The domain stops serving immediately and can&apos;t be
              re-activated, only re-registered from scratch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={cascade}
                onCheckedChange={(v) => setCascade(v === true)}
              />
              Also delete all links on this domain
            </label>
            <InfoHint label="About deleting links with the domain">
              Deletes every link on this domain and its analytics. Unchecked,
              the links are kept but stop resolving.
            </InfoHint>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => revoke.mutate()}
            >
              Revoke domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
