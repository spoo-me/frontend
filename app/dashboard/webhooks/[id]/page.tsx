"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  History,
  LoaderCircle,
  Pause,
  Pencil,
  Play,
  Send,
  ShieldAlert,
  TriangleAlert,
  Webhook,
} from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"

import {
  deleteWebhook,
  getWebhook,
  listWebhookDeliveries,
  listWebhookEventTypes,
  retryWebhookDelivery,
  sendTestWebhook,
  updateWebhook,
  type WebhookDelivery,
} from "@/lib/api"
import { formatWhen } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useFeatureGuard } from "@/hooks/use-features"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
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
import { CopyButton } from "@/components/dashboard/copy-button"
import { StatusPill } from "@/components/dashboard/status-pill"
import { EndpointDialog } from "@/components/dashboard/webhooks/endpoint-dialog"

const PAGE_SIZE = 25

const DISABLED_REASONS: Record<string, string> = {
  gone: "The endpoint answered 410 Gone, which means it asked to be removed.",
  consecutive_failures:
    "Too many deliveries failed in a row after exhausting their retries.",
  secret_unreadable:
    "The stored signing secret can no longer be read. Delete this endpoint and create it again.",
  admin: "Disabled by an administrator.",
}

function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
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

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-3 px-4 py-2.5">
      <span className="label-mono w-24 shrink-0 text-muted-foreground/60">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function DeliveryRow({
  webhookId,
  delivery,
  expanded,
  onToggle,
}: {
  webhookId: string
  delivery: WebhookDelivery
  expanded: boolean
  onToggle: () => void
}) {
  const queryClient = useQueryClient()
  const retry = useMutation({
    mutationFn: () => retryWebhookDelivery(webhookId, delivery.id),
    onSuccess: (next) => {
      queryClient.invalidateQueries({
        queryKey: ["webhooks", webhookId, "deliveries"],
      })
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
      if (next.status === "success") toast.success("Delivered")
      else
        toast.error("Still failing", {
          description: next.attempts.at(-1)?.error ?? undefined,
        })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't retry"),
  })

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-accent/30"
      >
        <span
          className={cn(
            "w-14 shrink-0 font-mono text-[11px]",
            delivery.status === "failed"
              ? "text-destructive"
              : "text-muted-foreground"
          )}
        >
          {delivery.status}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-foreground text-xs">
          {delivery.event_type}
        </span>
        {delivery.is_test && (
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-[10px] text-muted-foreground">
            test
          </span>
        )}
        {delivery.attempt_count > 1 && (
          <span className="font-mono text-[11px] text-muted-foreground/60 tabular-nums">
            ×{delivery.attempt_count}
          </span>
        )}
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
          {formatWhen(delivery.created_at)}
        </span>
      </button>
      {expanded && (
        <div className="space-y-2 border-border/60 border-t bg-muted/20 px-4 py-3">
          {delivery.attempts.length === 0 && (
            <p className="font-mono text-[11px] text-muted-foreground/60">
              no attempts yet
              {delivery.next_attempt_at &&
                ` · next ${formatWhen(delivery.next_attempt_at)}`}
            </p>
          )}
          {delivery.attempts.map((attempt, i) => (
            <div key={`${delivery.id}-${i}`} className="space-y-1">
              <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {formatWhen(attempt.attempted_at)} ·{" "}
                {attempt.status_code ?? "no response"}
                {attempt.duration_ms != null && ` · ${attempt.duration_ms}ms`}
                {attempt.error && (
                  <span className="text-destructive"> · {attempt.error}</span>
                )}
              </p>
              {attempt.response_body && (
                <pre className="overflow-x-auto rounded-md bg-muted/40 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">
                  {attempt.response_body}
                </pre>
              )}
            </div>
          ))}
          <p className="font-mono text-[10px] text-muted-foreground/50">
            {delivery.webhook_id}
          </p>
          {delivery.status === "failed" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              disabled={retry.isPending}
              onClick={() => retry.mutate()}
            >
              {retry.isPending && (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              )}
              Retry now
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function WebhookDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const webhooksEnabled = useFeatureGuard("webhooks", () =>
    router.replace("/dashboard")
  )
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [testEvent, setTestEvent] = React.useState("webhook.test")
  const [page, setPage] = React.useState(1)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const endpoint = useQuery({
    queryKey: ["webhooks", params.id],
    queryFn: () => getWebhook(params.id),
    enabled: webhooksEnabled,
  })
  const ep = endpoint.data

  const catalog = useQuery({
    queryKey: ["webhook-event-types"],
    queryFn: listWebhookEventTypes,
    staleTime: Number.POSITIVE_INFINITY,
    enabled: webhooksEnabled,
  })

  const deliveries = useQuery({
    queryKey: ["webhooks", params.id, "deliveries", { page }],
    queryFn: () =>
      listWebhookDeliveries(params.id, { page, pageSize: PAGE_SIZE }),
    enabled: webhooksEnabled,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["webhooks"] })
  }

  const sendTest = useMutation({
    mutationFn: () => sendTestWebhook(params.id, testEvent),
    onSuccess: (delivery) => {
      invalidate()
      const attempt = delivery.attempts[0]
      if (delivery.status === "success")
        toast.success(
          attempt?.status_code != null && attempt?.duration_ms != null
            ? `Delivered · ${attempt.status_code} in ${attempt.duration_ms}ms`
            : "Test delivered"
        )
      else
        toast.error("Test failed", {
          description:
            attempt?.error ??
            (attempt?.status_code
              ? `status ${attempt.status_code}`
              : undefined),
        })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't send the test"),
  })

  const setStatus = useMutation({
    mutationFn: (status: "active" | "paused") =>
      updateWebhook(params.id, { status }),
    onSuccess: (next) => {
      queryClient.setQueryData(["webhooks", params.id], next)
      invalidate()
      toast.success(
        next.status === "paused"
          ? "Endpoint paused"
          : next.status === "active"
            ? "Endpoint active"
            : "Endpoint updated"
      )
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't update"),
  })

  const remove = useMutation({
    mutationFn: () => deleteWebhook(params.id),
    onSuccess: () => {
      invalidate()
      toast.success("Endpoint deleted")
      router.push("/dashboard/webhooks")
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't delete"),
  })

  if (endpoint.isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-7 w-64" />
        <Skeleton className="mt-2.5 h-3.5 w-44" />
        <Skeleton className="mt-8 h-40 w-full" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    )
  }
  if (!ep) return null

  const name = ep.description || hostOf(ep.url)
  const rows = deliveries.data?.items ?? []
  const total = deliveries.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const testOptions = catalog.data ?? []

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <div>
        <Link
          href="/dashboard/webhooks"
          className="label-mono inline-flex items-center gap-1.5 text-muted-foreground/60 transition-colors duration-150 hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Webhooks
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <h1 className="truncate font-semibold text-foreground text-xl tracking-tight">
            {name}
          </h1>
          <StatusPill status={ep.status} kind="webhook" explain />
          {ep.status !== "disabled" && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto max-sm:ml-0"
              disabled={setStatus.isPending}
              onClick={() =>
                setStatus.mutate(ep.status === "paused" ? "active" : "paused")
              }
            >
              {ep.status === "paused" ? (
                <Play data-icon="inline-start" />
              ) : (
                <Pause data-icon="inline-start" />
              )}
              {ep.status === "paused" ? "Resume" : "Pause"}
            </Button>
          )}
        </div>
        <p className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
          <span>{ep.signing_secret_prefix}…</span>
          <span aria-hidden>·</span>
          <span>created {formatWhen(ep.created_at)}</span>
          {ep.last_delivery_at && (
            <>
              <span aria-hidden>·</span>
              <span>last delivery {formatWhen(ep.last_delivery_at)}</span>
            </>
          )}
        </p>
      </div>

      {ep.status === "disabled" && (
        <Enter i={0}>
          <Panel className="mt-6 border-amber-500/25 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <TriangleAlert className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="font-medium text-foreground text-sm">
                  Deliveries stopped
                </div>
                <p className="text-muted-foreground text-xs">
                  {DISABLED_REASONS[ep.disabled_reason ?? ""] ??
                    "Disabled by the system."}
                  {ep.last_failure_reason && (
                    <span className="font-mono">
                      {" "}
                      ({ep.last_failure_reason})
                    </span>
                  )}
                </p>
              </div>
              {ep.disabled_reason !== "secret_unreadable" && (
                <Button
                  size="sm"
                  disabled={setStatus.isPending}
                  onClick={() => setStatus.mutate("active")}
                >
                  Resume deliveries
                </Button>
              )}
            </div>
          </Panel>
        </Enter>
      )}

      <Enter i={0}>
        <div className="mt-8">
          <SectionHeader
            icon={Webhook}
            title="Endpoint"
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => setEditOpen(true)}
              >
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
            }
          />
          <Panel className="mt-2 divide-y divide-border/60">
            <DetailRow label="URL">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-mono text-foreground text-xs">
                  {ep.url}
                </span>
                <CopyButton value={ep.url} />
              </span>
            </DetailRow>
            <DetailRow label="Events">
              <span className="flex flex-wrap items-center gap-1">
                {ep.events.map((event) => (
                  <span
                    key={event}
                    className="rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {event}
                  </span>
                ))}
              </span>
            </DetailRow>
            <DetailRow label="Flavor">
              <span className="font-mono text-foreground text-xs">
                {ep.flavor}
              </span>
            </DetailRow>
            <DetailRow label="Links">
              <span className="font-mono text-foreground text-xs">
                {ep.scope_links
                  ? `${ep.scope_links.length} selected`
                  : "all links"}
              </span>
            </DetailRow>
            {ep.description && (
              <DetailRow label="Notes">
                <span className="text-foreground text-xs">
                  {ep.description}
                </span>
              </DetailRow>
            )}
            <DetailRow label="Delivered">
              <span className="font-mono text-foreground text-xs tabular-nums">
                {ep.total_successes} of {ep.total_deliveries}
              </span>
            </DetailRow>
          </Panel>
        </div>
      </Enter>

      <Enter i={1}>
        <div className="mt-8">
          <SectionHeader icon={Send} title="Test" />
          <Panel className="mt-2 flex flex-wrap items-center gap-3 p-4">
            <NativeSelect
              value={testEvent}
              onChange={(e) => setTestEvent(e.target.value)}
              className="h-8 w-48 font-mono text-xs"
              aria-label="Test event type"
            >
              {testOptions.map((spec) => (
                <option key={spec.type} value={spec.type}>
                  {spec.type}
                </option>
              ))}
            </NativeSelect>
            <Button
              size="sm"
              disabled={sendTest.isPending}
              onClick={() => sendTest.mutate()}
            >
              {sendTest.isPending && (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              )}
              Send test
            </Button>
            <p className="w-full text-muted-foreground/70 text-xs sm:w-auto">
              Sends the event&apos;s documented sample through the real
              pipeline.
            </p>
          </Panel>
        </div>
      </Enter>

      <Enter i={2}>
        <div className="mt-8">
          <SectionHeader icon={History} title="Deliveries" />
          <Panel className="mt-2">
            {deliveries.isPending ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !rows.length ? (
              <div className="pattern-dots m-4 flex h-28 flex-col items-center justify-center gap-2 rounded-lg">
                <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
                  No deliveries yet
                </span>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/60">
                  {rows.map((delivery) => (
                    <DeliveryRow
                      key={delivery.id}
                      webhookId={params.id}
                      delivery={delivery}
                      expanded={expandedId === delivery.id}
                      onToggle={() =>
                        setExpandedId(
                          expandedId === delivery.id ? null : delivery.id
                        )
                      }
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex h-11 items-center justify-between border-border/60 border-t bg-muted/30 px-4">
                    <span className="font-mono text-muted-foreground text-xs tabular-nums">
                      page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Previous page"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Next page"
                        disabled={!deliveries.data?.hasNext}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>
        </div>
      </Enter>

      <Enter i={3}>
        <div className="mt-8">
          <SectionHeader icon={ShieldAlert} title="Danger zone" />
          <Panel className="mt-2 flex flex-wrap items-center justify-between gap-3 border-destructive/20 p-4">
            <div>
              <div className="font-medium text-foreground text-sm">
                Delete this endpoint
              </div>
              <div className="text-muted-foreground text-xs">
                Deliveries stop immediately and the signing secret is gone for
                good.
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              Delete endpoint
            </Button>
          </Panel>
        </div>
      </Enter>

      <EndpointDialog
        mode="edit"
        endpoint={ep}
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v)
          if (!v)
            queryClient.invalidateQueries({ queryKey: ["webhooks", params.id] })
        }}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Deliveries stop immediately and the signing secret is gone for
              good. The delivery log is deleted with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => remove.mutate()}
            >
              Delete endpoint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
