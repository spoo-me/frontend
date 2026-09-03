"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"
import Link from "next/link"

import { deleteTag, SpooApiError, type Tag } from "@/lib/api"
import { formatCount, formatWhen } from "@/lib/format"
import { cn } from "@/lib/utils"
import { trackUiAction } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Panel } from "@/components/dashboard/section"
import { TagGlyph, tagChipClass } from "@/components/dashboard/tags/tag-glyph"
import { useTags } from "@/components/dashboard/tags/tag-picker"
import {
  suggestTagColor,
  TagDialog,
  TAGS_QUERY_KEY,
} from "@/components/dashboard/tags/tag-dialog"

export default function TagsPage() {
  const tags = useTags()
  const queryClient = useQueryClient()
  const items = tags.data?.items ?? []
  const [query, setQuery] = React.useState("")
  const q = query.trim().toLowerCase()
  const shown = q ? items.filter((t) => t.name.includes(q)) : items

  const [editing, setEditing] = React.useState<Tag | "new" | null>(null)
  const [deleting, setDeleting] = React.useState<Tag | null>(null)
  const openNew = () => setEditing("new")
  const openEdit = (tag: Tag) => setEditing(tag)

  const remove = useMutation({
    mutationFn: (tag: Tag) => deleteTag(tag.id),
    onSuccess: (res, tag) => {
      trackUiAction("tag_saved", "delete")
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      queryClient.invalidateQueries({ queryKey: ["url"] })
      toast.success(
        res.links_updated
          ? `Deleted ${tag.name}, removed from ${res.links_updated} link${res.links_updated === 1 ? "" : "s"}`
          : `Deleted ${tag.name}`
      )
      setDeleting(null)
    },
    onError: (err) =>
      toast.error(
        err instanceof SpooApiError ? err.message : "Couldn't delete the tag"
      ),
  })

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="label-mono text-muted-foreground/60">Tags</span>
          <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
            Tags
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Group links for filtering, bulk edits and analytics. A tag is one
            colour and an icon.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus data-icon="inline-start" />
          New tag
        </Button>
      </div>

      {items.length > 8 && (
        <div className="relative mt-6 max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tags"
            spellCheck={false}
            autoComplete="off"
            className="pl-8 text-[13px]"
          />
        </div>
      )}

      <Panel className={items.length > 8 ? "mt-3" : "mt-6"}>
        {tags.isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !items.length ? (
          <div className="pattern-dots m-4 flex h-48 flex-col items-center justify-center gap-3 rounded-lg">
            <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
              No tags yet
            </span>
            <Button onClick={openNew}>
              <Plus data-icon="inline-start" />
              Make your first tag
            </Button>
          </div>
        ) : !shown.length ? (
          <div className="flex h-24 items-center justify-center font-mono text-[11px] text-muted-foreground/70">
            No tags match
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {shown.map((tag, i) => (
              <motion.li
                key={tag.id}
                initial={q ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                  delay: Math.min(i, 12) * 0.03,
                }}
                className="group flex items-center transition-colors duration-150 hover:bg-accent/40"
              >
                <Link
                  href={`/dashboard/links?tags=${encodeURIComponent(tag.id)}`}
                  title="Show these links"
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                      tagChipClass(tag.color)
                    )}
                  >
                    <TagGlyph
                      color={tag.color}
                      icon={tag.icon}
                      className="size-4"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="ph-no-capture block truncate font-medium font-mono text-foreground text-sm">
                      {tag.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      created {formatWhen(tag.created_at)}
                    </span>
                  </span>
                  <span className="font-mono text-muted-foreground text-xs tabular-nums">
                    {formatCount(tag.link_count)} link
                    {tag.link_count === 1 ? "" : "s"}
                  </span>
                </Link>
                <span className="flex items-center gap-0.5 pr-3 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${tag.name}`}
                    onClick={() => openEdit(tag)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${tag.name}`}
                    onClick={() => setDeleting(tag)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </Panel>

      <TagDialog
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        tag={editing === "new" ? null : editing}
        initialColor={suggestTagColor(items)}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.link_count
                ? `The tag comes off ${deleting.link_count} link${deleting.link_count === 1 ? "" : "s"}. The links themselves stay.`
                : "No links carry this tag."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (deleting) remove.mutate(deleting)
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete tag"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
