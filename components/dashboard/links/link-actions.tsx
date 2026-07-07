"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Copy,
  Ellipsis,
  ExternalLink,
  Pause,
  Play,
  ScanLine,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { deleteUrl, setUrlStatus, type UrlListItem } from "@/lib/api"
import { Button } from "@/components/ui/button"
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
  const [confirmOpen, setConfirmOpen] = React.useState(false)

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
      toast.success(next.status === "ACTIVE" ? "Link activated" : "Link deactivated")
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update"),
  })

  // Delete is destructive → confirm dialog (SPEC §5).
  const remove = useMutation({
    mutationFn: () => deleteUrl(link.id),
    onSuccess: () => {
      invalidate()
      toast.success("Link deleted")
      onDeleted?.()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't delete"),
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
              toast.success("Copied", { description: short.replace(/^https?:\/\//, "") })
            }}
          >
            <Copy />
            Copy short link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open(short, "_blank")}>
            <ExternalLink />
            Open
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => router.push(`/dashboard/links/${link.alias}`)}
          >
            <ScanLine />
            Full page
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
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {(link.domain ?? "spoo.me") + "/" + link.alias}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The short link stops working immediately and its analytics are
              deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
