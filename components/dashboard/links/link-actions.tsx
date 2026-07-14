"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Copy,
  Ellipsis,
  ExternalLink,
  Pause,
  Pin,
  Play,
  ScanLine,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { trackLinkDeleted } from "@/lib/analytics"
import { deleteUrl, setUrlStatus, type UrlListItem } from "@/lib/api"
import { linkDetailPath } from "@/lib/link-detail"
import { MAX_WIDGETS } from "@/lib/analytics-layout"
import { useAnalyticsLayout } from "@/hooks/use-analytics-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function shortUrlOf(link: UrlListItem) {
  return `https://${link.domain ?? "spoo.me"}/${link.alias}`
}

/** Shared row/record actions: table rows, the sheet, and the detail page. */
export function LinkActions({
  link,
  onDeleted,
  align = "end",
}: {
  link: UrlListItem
  onDeleted?: () => void
  align?: "end" | "start"
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const lay = useAnalyticsLayout()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState("")
  const confirmed = confirmText.trim().toLowerCase() === "delete"

  // Pin: land this link's clicks chart on the analytics board, already
  // scoped and titled. One click means one click — no dialog.
  const pin = () => {
    const alias = link.alias
    if (!alias) return
    if (lay.layout.widgets.length >= MAX_WIDGETS) {
      toast.error("The analytics board is full")
      return
    }
    lay.addWidget(
      "timeseries",
      { scope: { short_code: [alias] }, title: `/${alias}` },
      "pin"
    )
    toast.success("Pinned to Analytics", {
      description: `Clicks over time for /${link.alias}`,
      action: {
        label: "View",
        onClick: () => router.push("/dashboard/analytics"),
      },
    })
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["urls"] })
    queryClient.invalidateQueries({ queryKey: ["stats"] })
  }

  // Deactivate/activate is cheap + reversible → optimistic-feeling, no confirm.
  const toggle = useMutation({
    mutationFn: () =>
      setUrlStatus(link.id, link.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"),
    onSuccess: (next) => {
      invalidate()
      toast.success(
        next.status === "ACTIVE" ? "Link activated" : "Link deactivated"
      )
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't update"),
  })

  // Delete is destructive → confirm dialog (SPEC §5).
  const remove = useMutation({
    mutationFn: () => deleteUrl(link.id),
    onSuccess: () => {
      trackLinkDeleted()
      invalidate()
      toast.success("Link deleted")
      onDeleted?.()
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't delete"),
  })

  const short = shortUrlOf(link)
  const canToggle = link.status === "ACTIVE" || link.status === "INACTIVE"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${link.alias}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onSelect={() => {
              navigator.clipboard.writeText(short)
              toast.success("Copied", {
                description: short.replace(/^https?:\/\//, ""),
              })
            }}
          >
            <Copy />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open(short, "_blank")}>
            <ExternalLink />
            Open
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push(linkDetailPath(link))}>
            <ScanLine />
            Full page
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={pin}>
            <Pin />
            Pin to dashboard
          </DropdownMenuItem>
          {canToggle && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => toggle.mutate()}>
                {link.status === "ACTIVE" ? <Pause /> : <Play />}
                {link.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* The dialog is portaled but React events still bubble to the owning
          row: swallow them so an overlay click can't open the link sheet,
          and treat it as dismiss instead. */}
      <span
        onClick={(e) => {
          e.stopPropagation()
          if (
            (e.target as HTMLElement).closest?.(
              "[data-slot=alert-dialog-overlay]"
            )
          ) {
            setConfirmOpen(false)
            setConfirmText("")
          }
        }}
      >
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            setConfirmOpen(open)
            if (!open) setConfirmText("")
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {(link.domain ?? "spoo.me") + "/" + link.alias}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                The short link stops working immediately and its analytics are
                deleted. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs">
                Type <span className="font-mono text-foreground">delete</span>{" "}
                to confirm.
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                spellCheck={false}
                autoComplete="off"
                className="h-9 font-mono text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && confirmed) {
                    setConfirmOpen(false)
                    setConfirmText("")
                    remove.mutate()
                  }
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!confirmed}
                onClick={() => remove.mutate()}
              >
                Delete link
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </span>
    </>
  )
}
