"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import {
  Ellipsis,
  Pause,
  Play,
  Plus,
  Send,
  Trash2,
  Webhook,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteWebhook,
  listWebhooks,
  sendTestWebhook,
  updateWebhook,
  type WebhookEndpoint,
} from "@/lib/api"
import { formatWhen } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useFeatureGuard } from "@/hooks/use-features"
import { LimitCounter, Limited } from "@/components/plan/limited"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Panel } from "@/components/dashboard/section"
import { EndpointDialog } from "@/components/dashboard/webhooks/endpoint-dialog"

function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function endpointName(endpoint: WebhookEndpoint) {
  return endpoint.description || hostOf(endpoint.url)
}

function EndpointRow({ endpoint }: { endpoint: WebhookEndpoint }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["webhooks"] })
    queryClient.invalidateQueries({ queryKey: ["entitlements"] })
  }

  const sendTest = useMutation({
    mutationFn: () => sendTestWebhook(endpoint.id),
    onSuccess: (delivery) => {
      invalidate()
      if (delivery.status === "success") toast.success("Test delivered")
      else
        toast.error("Test failed", {
          description:
            delivery.attempts[0]?.error ??
            (delivery.attempts[0]?.status_code
              ? `status ${delivery.attempts[0].status_code}`
              : undefined),
        })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't send the test"),
  })

  const setStatus = useMutation({
    mutationFn: (status: "active" | "paused") =>
      updateWebhook(endpoint.id, { status }),
    onSuccess: (next) => {
      invalidate()
      toast.success(
        next.status === "paused" ? "Endpoint paused" : "Endpoint resumed"
      )
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't update"),
  })

  const remove = useMutation({
    mutationFn: () => deleteWebhook(endpoint.id),
    onSuccess: () => {
      invalidate()
      toast.success("Endpoint deleted")
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't delete"),
  })

  const disabled = endpoint.status === "disabled"
  const paused = endpoint.status === "paused"

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/webhooks/${endpoint.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/dashboard/webhooks/${endpoint.id}`)
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-accent/30",
        disabled && "opacity-55"
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
        <Webhook className="size-4 text-foreground" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground text-sm">
            {endpointName(endpoint)}
          </span>
          {disabled && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-[10px] text-destructive">
              disabled
            </span>
          )}
          {paused && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-[10px] text-muted-foreground">
              paused
            </span>
          )}
        </div>
        <div className="mt-1 truncate text-muted-foreground text-xs">
          {hostOf(endpoint.url)} ·{" "}
          {endpoint.last_delivery_at
            ? `last delivery ${formatWhen(endpoint.last_delivery_at)}`
            : "no deliveries yet"}
        </div>
      </div>
      {/* Row navigation must not swallow the menu. */}
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${endpointName(endpoint)}`}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto">
            <DropdownMenuItem
              disabled={sendTest.isPending}
              onSelect={() => sendTest.mutate()}
            >
              <Send />
              Send test
            </DropdownMenuItem>
            {!disabled && (
              <DropdownMenuItem
                onSelect={() => setStatus.mutate(paused ? "active" : "paused")}
              >
                {paused ? <Play /> : <Pause />}
                {paused ? "Resume" : "Pause"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirmOpen(true)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {endpointName(endpoint)}?
              </AlertDialogTitle>
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
    </div>
  )
}

export default function WebhooksPage() {
  const router = useRouter()
  const webhooksEnabled =
    useFeatureGuard("webhooks", () => router.replace("/dashboard")) ===
    "enabled"
  const [createOpen, setCreateOpen] = React.useState(false)

  const webhooks = useQuery({
    queryKey: ["webhooks"],
    queryFn: listWebhooks,
    enabled: webhooksEnabled,
  })
  const items = webhooks.data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <div className="flex items-start justify-between">
        <div>
          <span className="flex items-center gap-3">
            <span className="label-mono text-muted-foreground/60">
              Webhooks
            </span>
            <LimitCounter limit="webhook_endpoints_max" />
          </span>
          <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
            Endpoints
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Signed event deliveries for your account&apos;s events.
          </p>
        </div>
        <Limited
          limit="webhook_endpoints_max"
          onAdd={() => setCreateOpen(true)}
        >
          <Plus data-icon="inline-start" />
          New endpoint
        </Limited>
      </div>

      <Panel className="mt-6">
        {webhooks.isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !items.length ? (
          <div className="pattern-dots m-4 flex h-40 flex-col items-center justify-center gap-3 rounded-lg">
            <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
              No endpoints yet
            </span>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Add your first endpoint
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {items.map((endpoint) => (
              <EndpointRow key={endpoint.id} endpoint={endpoint} />
            ))}
          </div>
        )}
      </Panel>

      <EndpointDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
