"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createTag,
  SpooApiError,
  type Tag,
  type TagColor,
  TAG_COLORS,
  updateTag,
} from "@/lib/api"
import { trackUiAction } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  emptyTagDraft,
  TagFields,
  tagDraftProblem,
  type TagDraft,
} from "@/components/dashboard/tags/tag-fields"

/** React Query key for the account's tag list; invalidated wherever tags change. */
export const TAGS_QUERY_KEY = ["tags"] as const

/** The least-used non-gray colour among `tags`, so new tags spread out. */
export function suggestTagColor(
  tags: ReadonlyArray<Pick<Tag, "color">>
): TagColor {
  const used = new Map<TagColor, number>()
  for (const t of tags) used.set(t.color, (used.get(t.color) ?? 0) + 1)
  return (
    TAG_COLORS.filter((c) => c !== "gray").sort(
      (a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0)
    )[0] ?? "violet"
  )
}

/**
 * The one create/edit dialog for a tag. `tag` set = edit; otherwise create,
 * seeded with `initialName` and `initialColor`. `onSaved` gets the server's
 * tag back so a picker can attach it right away.
 */
export function TagDialog({
  open,
  onOpenChange,
  tag,
  initialName = "",
  initialColor = "violet",
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag?: Tag | null
  initialName?: string
  initialColor?: TagColor
  onSaved?: (tag: Tag) => void
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = React.useState<TagDraft>(emptyTagDraft())
  // Reseed whenever the dialog opens: edits start from the tag, creates
  // from what the caller typed.
  React.useEffect(() => {
    if (!open) return
    setDraft(
      tag
        ? { name: tag.name, color: tag.color, icon: tag.icon }
        : { ...emptyTagDraft(initialColor), name: initialName }
    )
  }, [open, tag, initialName, initialColor])

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: draft.name.trim(),
        color: draft.color,
        icon: draft.icon,
      }
      return tag ? updateTag(tag.id, body) : createTag(body)
    },
    onSuccess: (saved) => {
      trackUiAction("tag_saved", tag ? "update" : "create")
      // Seed the list before the refetch so a picker can label the new tag
      // the moment it selects it.
      queryClient.setQueryData<{ items: Tag[] }>(TAGS_QUERY_KEY, (cur) => {
        const items = cur?.items ?? []
        return items.some((t) => t.id === saved.id)
          ? { items: items.map((t) => (t.id === saved.id ? saved : t)) }
          : { items: [...items, saved] }
      })
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      queryClient.invalidateQueries({ queryKey: ["url"] })
      toast.success(tag ? "Tag updated" : "Tag created")
      onOpenChange(false)
      onSaved?.(saved)
    },
    onError: (err) =>
      toast.error(
        err instanceof SpooApiError ? err.message : "Couldn't save the tag"
      ),
  })
  const problem = tagDraftProblem(draft)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tag ? "Edit tag" : "New tag"}</DialogTitle>
          <DialogDescription>
            {tag
              ? "Links keep pointing at the tag, so changes show up everywhere at once."
              : "Pick a name, a colour and an icon."}
          </DialogDescription>
        </DialogHeader>
        <TagFields
          draft={draft}
          onChange={setDraft}
          autoFocus
          idPrefix={tag ? `tag-${tag.id}` : "tag-new"}
          onSubmit={() => !problem && save.mutate()}
        />
        <DialogFooter>
          <Button
            disabled={!!problem || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : tag ? "Save changes" : "Create tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
