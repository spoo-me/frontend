"use client"

import * as React from "react"
import { Search } from "lucide-react"

import {
  TAG_COLORS,
  TAG_ICON_KEYS,
  TAG_MAX_LENGTH,
  type TagColor,
  normalizeTagName,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  TAG_ICONS,
  TagGlyph,
  tagBgClass,
  tagTextClass,
} from "@/components/dashboard/tags/tag-glyph"

export type TagDraft = { name: string; color: TagColor; icon: string }

/** Same field anatomy as the link composer and settings form. */
function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className="mb-2.5 font-medium text-foreground text-xs"
      >
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground/70 text-xs">{hint}</p>}
    </div>
  )
}

export function emptyTagDraft(color: TagColor = "violet"): TagDraft {
  return { name: "", color, icon: "tag" }
}

/** Blocking problem with a draft, or null. Mirrors the server rules. */
export function tagDraftProblem(draft: TagDraft): string | null {
  if (!draft.name.trim()) return "Name the tag."
  if (!normalizeTagName(draft.name))
    return `Letters, digits, spaces, - _ . only, up to ${TAG_MAX_LENGTH} characters.`
  return null
}

/**
 * Name, colour and icon for one tag. Shared by the inline create in the
 * picker and the Tags page dialog, so a tag looks the same wherever it is
 * made. Compact on purpose: swatches in one row, icons in a searchable grid.
 */
export function TagFields({
  draft,
  onChange,
  autoFocus,
  onSubmit,
  idPrefix = "tag",
}: {
  draft: TagDraft
  onChange: (next: TagDraft) => void
  autoFocus?: boolean
  onSubmit?: () => void
  idPrefix?: string
}) {
  const [iconQuery, setIconQuery] = React.useState("")
  const q = iconQuery.trim().toLowerCase()
  const icons = q ? TAG_ICON_KEYS.filter((k) => k.includes(q)) : TAG_ICON_KEYS
  const preview = {
    name: draft.name || "tag name",
    color: draft.color,
    icon: draft.icon,
  }

  return (
    <div className="space-y-5">
      <Field
        label="Name"
        htmlFor={`${idPrefix}-name`}
        hint="Lowercase; letters, digits, spaces, - _ . only."
      >
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2">
            <TagGlyph color={preview.color} icon={preview.icon} />
          </span>
          <Input
            id={`${idPrefix}-name`}
            value={draft.name}
            autoFocus={autoFocus}
            maxLength={TAG_MAX_LENGTH}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && onSubmit) {
                e.preventDefault()
                onSubmit()
              }
            }}
            placeholder="launch"
            spellCheck={false}
            autoComplete="off"
            className="pl-8 font-mono text-xs"
          />
        </div>
      </Field>

      <Field label="Colour">
        <div
          className="flex items-center gap-1.5"
          role="radiogroup"
          aria-label="Tag colour"
        >
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={draft.color === c}
              aria-label={c}
              title={c}
              onClick={() => onChange({ ...draft, color: c })}
              className={cn(
                "flex size-6 items-center justify-center rounded-md border transition-colors duration-150",
                draft.color === c
                  ? "border-foreground/40"
                  : "border-transparent hover:border-border"
              )}
            >
              <span className={cn("size-3 rounded-full", tagBgClass(c))} />
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Icon"
        hint="Search the set; the icon takes the tag's colour."
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={iconQuery}
            onChange={(e) => setIconQuery(e.target.value)}
            placeholder="Search icons"
            spellCheck={false}
            autoComplete="off"
            className="pl-8 text-[13px]"
          />
        </div>
        <div
          role="listbox"
          aria-label="Tag icon"
          className="grid max-h-32 grid-cols-10 gap-0.5 overflow-y-auto rounded-lg border border-border/60 p-1.5"
        >
          {icons.map((key) => {
            const Icon = TAG_ICONS[key]
            const active = draft.icon === key
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                aria-label={key}
                title={key}
                onClick={() => onChange({ ...draft, icon: key })}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-accent/60",
                  active && "bg-accent"
                )}
              >
                <Icon
                  className={cn(
                    "size-3.5",
                    active ? tagTextClass(draft.color) : "text-muted-foreground"
                  )}
                  strokeWidth={2}
                />
              </button>
            )
          })}
          {!icons.length && (
            <span className="col-span-10 py-3 text-center font-mono text-[11px] text-muted-foreground/60">
              no icons match
            </span>
          )}
        </div>
      </Field>
    </div>
  )
}
