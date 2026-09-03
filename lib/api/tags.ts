import { authedFetch, jsonInit, parse } from "./client"

/* Tags are a per-account registry (backend `tags` collection). Links point
   at them by id and embed `{id, name, color, icon}` refs on every response. */

export const TAG_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
] as const
export type TagColor = (typeof TAG_COLORS)[number]

/** A tag as embedded on a link. */
export type TagRef = {
  id: string
  name: string
  color: TagColor
  /** A curated icon key; every tag has one (`tag` by default). */
  icon: string
}

/** A tag on its own endpoints. */
export type Tag = TagRef & {
  link_count: number
  created_at: string
  updated_at: string | null
}

/** The curated icon keys, exactly shared/tag_icons.py on the server. The
    glyph component maps each to a lucide icon; the mock validates against
    this list. Kept here (not in the component) so server code can import it. */
export const TAG_ICON_KEYS = [
  "rocket",
  "megaphone",
  "flag",
  "star",
  "heart",
  "bookmark",
  "tag",
  "hash",
  "zap",
  "flame",
  "sparkles",
  "trophy",
  "target",
  "crown",
  "gem",
  "gift",
  "calendar",
  "clock",
  "timer",
  "hourglass",
  "briefcase",
  "building",
  "store",
  "shopping-cart",
  "credit-card",
  "wallet",
  "banknote",
  "receipt",
  "mail",
  "send",
  "bell",
  "message-square",
  "phone",
  "video",
  "camera",
  "image",
  "music",
  "mic",
  "book",
  "newspaper",
  "file-text",
  "folder",
  "pen-line",
  "code",
  "terminal",
  "bug",
  "wrench",
  "settings",
  "flask-conical",
  "beaker",
  "lightbulb",
  "graduation-cap",
  "globe",
  "map-pin",
  "compass",
  "plane",
  "car",
  "home",
  "users",
  "user",
  "handshake",
  "shield",
  "lock",
  "key",
  "link",
  "share-2",
  "trending-up",
  "bar-chart-3",
  "pie-chart",
  "layers",
  "package",
  "box",
  "puzzle",
  "gamepad-2",
  "coffee",
  "pizza",
  "leaf",
  "sun",
  "moon",
  "cloud",
  "umbrella",
  "smile",
  "ghost",
  "cat",
  "dog",
  "bird",
  "fish",
] as const

/** Server caps mirrored so the UI can refuse what the API would 422. */
export const TAG_MAX_LENGTH = 32
export const TAGS_MAX_PER_LINK = 10
export const TAGS_MAX_PER_ACCOUNT = 500
const TAG_ALLOWED = /^[\p{L}\p{N}\p{M} ._-]+$/u

/** Server normalisation of a tag name: trim, lowercase, collapse
    whitespace, letters/digits/marks plus space, `-`, `_`, `.`. Null when the
    server would reject it. */
export function normalizeTagName(raw: string): string | null {
  const name = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
  if (!name || name.length > TAG_MAX_LENGTH || !TAG_ALLOWED.test(name))
    return null
  return name
}

/** Order-sensitive id list equality; undefined and [] alike. */
export function sameTagIds(
  a: readonly string[] | null | undefined,
  b: readonly string[] | null | undefined
) {
  const x = a ?? []
  const y = b ?? []
  return x.length === y.length && x.every((t, i) => t === y[i])
}

export function listTags() {
  return authedFetch("/api/v1/tags", { method: "GET" }).then((r) =>
    parse<{ items: Tag[] }>(r)
  )
}

export type CreateTagInput = {
  name: string
  /** Omit to let the server pick the least-used colour. */
  color?: TagColor
  /** Omit for the generic tag glyph. */
  icon?: string
}

export function createTag(input: CreateTagInput) {
  return authedFetch("/api/v1/tags", jsonInit("POST", input)).then((r) =>
    parse<Tag>(r)
  )
}

export type UpdateTagInput = Partial<{
  name: string
  color: TagColor
  icon: string
}>

export function updateTag(tagId: string, input: UpdateTagInput) {
  return authedFetch(
    `/api/v1/tags/${encodeURIComponent(tagId)}`,
    jsonInit("PATCH", input)
  ).then((r) => parse<Tag>(r))
}

/** Deletes the tag and strips it from every link that carried it. */
export function deleteTag(tagId: string) {
  return authedFetch(`/api/v1/tags/${encodeURIComponent(tagId)}`, {
    method: "DELETE",
  }).then((r) => parse<{ deleted: boolean; links_updated: number }>(r))
}
