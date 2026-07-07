"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  BadgeCheck,
  Globe,
  LoaderCircle,
  Route,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  getCustomDomain,
  revokeCustomDomain,
  updateCustomDomain,
  verifyCustomDomain,
  type CustomDomain,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { StatusPill } from "@/components/dashboard/status-pill"
import { CopyButton } from "@/components/dashboard/copy-button"

/**
 * The multi-step domain setup, driven entirely by SERVER state — the step
 * you see is a pure function of `status`, so it survives refreshes by
 * construction (SPEC §2).
 */

const STEPS = ["Register", "DNS records", "Verify", "Live"] as const

function stepIndex(status: CustomDomain["status"]): number {
  switch (status) {
    case "PENDING":
      return 1
    case "VERIFYING":
      return 2
    case "ACTIVE":
      return 3
    default:
      return 0
  }
}

function StepRail({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((step, i) => (
        <React.Fragment key={step}>
          {i > 0 && (
            <span
              className={cn(
                "h-px w-6",
                i <= current ? "bg-foreground/40" : "bg-border",
              )}
            />
          )}
          <li
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px]",
              i < current
                ? "border-live/30 bg-live/8 text-live"
                : i === current
                  ? "border-border bg-card text-foreground"
                  : "border-border/60 text-muted-foreground/60 border-dashed",
            )}
          >
            {i < current && <BadgeCheck className="size-3" />}
            {step}
          </li>
        </React.Fragment>
      ))}
    </ol>
  )
}

export default function DomainDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [cascade, setCascade] = React.useState(false)

  const domain = useQuery({
    queryKey: ["domains", params.id],
    queryFn: () => getCustomDomain(params.id),
  })
  const dom = domain.data

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["domains"] })
  }

  const verify = useMutation({
    mutationFn: () => verifyCustomDomain(params.id),
    onSuccess: (next) => {
      invalidate()
      queryClient.setQueryData(["domains", params.id], next)
      if (next.status === "ACTIVE") toast.success(`${next.fqdn} is live`)
      else if (next.last_verification_error)
        toast.info("Not verified yet", { description: next.last_verification_error })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Verification failed"),
  })

  const [rootRedirect, setRootRedirect] = React.useState<string | null>(null)
  const [notFound, setNotFound] = React.useState<string | null>(null)
  const routingDirty =
    dom &&
    ((rootRedirect !== null && rootRedirect !== (dom.root_redirect ?? "")) ||
      (notFound !== null && notFound !== (dom.not_found_redirect ?? "")))

  const saveRouting = useMutation({
    mutationFn: () =>
      updateCustomDomain(params.id, {
        ...(rootRedirect !== null ? { root_redirect: rootRedirect || null } : {}),
        ...(notFound !== null ? { not_found_redirect: notFound || null } : {}),
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(["domains", params.id], next)
      setRootRedirect(null)
      setNotFound(null)
      toast.success("Routing updated")
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  })

  const revoke = useMutation({
    mutationFn: () => revokeCustomDomain(params.id, cascade),
    onSuccess: () => {
      invalidate()
      toast.success("Domain revoked")
      router.push("/dashboard/domains")
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't revoke"),
  })

  if (domain.isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (!dom) return null

  const current = stepIndex(dom.status)

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/domains")}
          aria-label="Back to domains"
          className="text-muted-foreground hover:text-foreground hover:bg-accent/60 mt-0.5 flex size-7 items-center justify-center rounded-lg transition-colors duration-150"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-foreground truncate font-mono text-lg font-semibold tracking-tight">
              {dom.fqdn}
            </h1>
            <StatusPill status={dom.status} kind="domain" />
          </div>
          <div className="mt-3">
            <StepRail current={current} />
          </div>
        </div>
      </div>

      {/* Step 2/3: DNS + verify (hidden once ACTIVE) */}
      {dom.status !== "ACTIVE" && dom.status !== "REVOKED" && (
        <div className="mt-8">
          <SectionHeader icon={Globe} title="DNS records" />
          <Panel className="mt-2">
            <div className="divide-border/60 divide-y">
              {dom.dns_records.map((rec) => (
                <div key={rec.name + rec.type} className="flex items-center gap-3 px-4 py-3">
                  <span className="border-border/60 bg-muted/40 text-muted-foreground w-14 shrink-0 rounded-md border px-1.5 py-0.5 text-center font-mono text-[10px]">
                    {rec.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground truncate font-mono text-xs">{rec.name}</div>
                    <div className="text-muted-foreground truncate font-mono text-[11px]">
                      → {rec.value}
                    </div>
                  </div>
                  <CopyButton value={rec.value} />
                </div>
              ))}
            </div>
            <div className="border-border/60 bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <span className="text-muted-foreground text-xs">
                {dom.last_verification_error ??
                  dom.setup_notes[0] ??
                  "Add these records, then verify."}
              </span>
              <Button
                size="sm"
                disabled={verify.isPending}
                onClick={() => verify.mutate()}
              >
                {verify.isPending && (
                  <LoaderCircle data-icon="inline-start" className="animate-spin" />
                )}
                {dom.status === "PENDING" ? "Start verification" : "Check again"}
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {/* Step 4: routing config (ACTIVE only) */}
      {dom.status === "ACTIVE" && (
        <div className="mt-8">
          <SectionHeader icon={Route} title="Routing" />
          <Panel className="mt-2 space-y-5 p-5">
            <div className="space-y-1.5">
              <label className="text-foreground text-xs font-medium">Root redirect</label>
              <Input
                value={rootRedirect ?? dom.root_redirect ?? ""}
                onChange={(e) => setRootRedirect(e.target.value)}
                placeholder={`Where ${dom.fqdn}/ goes`}
                spellCheck={false}
                className="h-9 font-mono text-xs"
              />
              <p className="text-muted-foreground/70 text-xs">
                Visitors hitting the bare domain get sent here.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-foreground text-xs font-medium">
                Not-found redirect
              </label>
              <Input
                value={notFound ?? dom.not_found_redirect ?? ""}
                onChange={(e) => setNotFound(e.target.value)}
                placeholder="Where unknown aliases go (optional)"
                spellCheck={false}
                className="h-9 font-mono text-xs"
              />
            </div>
            <div
              className={cn(
                "flex justify-end transition-opacity duration-150",
                routingDirty ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <Button size="sm" disabled={saveRouting.isPending} onClick={() => saveRouting.mutate()}>
                Save routing
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {/* Danger zone */}
      {dom.status !== "REVOKED" && (
        <div className="mt-8">
          <SectionHeader icon={ShieldAlert} title="Danger zone" />
          <Panel className="border-destructive/20 mt-2 flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="text-foreground text-sm font-medium">Revoke this domain</div>
              <div className="text-muted-foreground text-xs">
                Links on {dom.fqdn} stop resolving. Revocation is terminal.
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
              Revoke domain
            </Button>
          </Panel>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {dom.fqdn}?</AlertDialogTitle>
            <AlertDialogDescription>
              The domain stops serving immediately and can&apos;t be re-activated,
              only re-registered from scratch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={cascade}
              onCheckedChange={(v) => setCascade(v === true)}
            />
            Also delete all links on this domain
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revoke.mutate()}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Revoke domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
