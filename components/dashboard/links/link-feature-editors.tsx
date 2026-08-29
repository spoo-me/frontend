"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { getAlpha2Codes } from "i18n-iso-countries"
import { HexColorPicker } from "react-colorful"
import {
  Check,
  ChevronDown,
  Globe,
  Info,
  Pipette,
  Plus,
  RotateCcw,
  Upload,
  X,
} from "lucide-react"
import {
  FaDiscord,
  FaLinkedinIn,
  FaSlack,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6"

import {
  type MetaPlatform,
  MetaPreview,
} from "@/components/shared/meta-preview"
import { cn } from "@/lib/utils"
import { urlProblem } from "@/lib/validation"
import {
  GEO_RULES_MAX_COUNTRIES,
  META_DESCRIPTION_MAX,
  META_IMAGE_MAX_BYTES,
  META_IMAGE_URL_MAX,
  META_TITLE_MAX,
  SpooApiError,
  type AbVariant,
  type GeoRules,
  type MetaTags,
  type MetaTagsInput,
  type UrlMetadata,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import { InfoHint } from "@/components/dashboard/info-hint"
import { Segmented } from "@/components/dashboard/segmented"

/**
 * The planned-capability editors (geo targeting, A/B testing, custom meta
 * tags), shared verbatim by the composer and the edit sheet so create and
 * edit stay one product. Drafts are loose strings; only complete rows
 * travel (see the helpers).
 */

/* ---------------------------------------------------------------- drafts */

export type GeoRuleDraft = { country: string; url: string }
export type VariantDraft = { url: string; weight: string }
export type MetaDraft = {
  title: string
  description: string
  image: string
  color: string
}

/** Forgiving URL normalization — missing scheme is fine, never scolded. */
export function normalizeUrl(raw: string): string {
  const v = raw.trim()
  if (!v) return v
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

export function looksLikeUrl(raw: string): boolean {
  const v = normalizeUrl(raw)
  try {
    const u = new URL(v)
    return u.hostname.includes(".")
  } catch {
    return false
  }
}

export const metaColorValid = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c)

/* Data-URI images (backend PR #231 upload path): the server decodes,
   magic-byte-checks and re-hosts them on the CDN, echoing the https URL
   back. The wire accepts exactly these three types, ≤512KB decoded. */
const META_DATA_URI_RE =
  /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/

export const isMetaImageDataUri = (v: string) => v.startsWith("data:")

/** Decoded byte count of a data URI's base64 payload. */
export function dataUriBytes(uri: string): number {
  const b64 = uri.slice(uri.indexOf(",") + 1)
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0
  return Math.max(0, (b64.length * 3) / 4 - pad)
}

const validMetaImageDataUri = (v: string) =>
  META_DATA_URI_RE.test(v) && dataUriBytes(v) <= META_IMAGE_MAX_BYTES

/** Canonical wire payload (PR #230 flat map): only complete rows travel;
    first occurrence of a country wins (duplicates block saving anyway —
    see geoRulesProblem). */
export const completeGeoRules = (rules: GeoRuleDraft[]): GeoRules => {
  const map: GeoRules = {}
  for (const r of rules) {
    if (!/^[A-Z]{2}$/.test(r.country) || r.country in map) continue
    if (!looksLikeUrl(r.url)) continue
    map[r.country] = normalizeUrl(r.url)
  }
  return map
}

/** Wire map → editor rows (settings form initial state). */
export const geoDraftsOf = (
  rules: GeoRules | null | undefined
): GeoRuleDraft[] =>
  Object.entries(rules ?? {}).map(([country, url]) => ({ country, url }))

/** Key-order-insensitive equality — the server echoes a normalized map. */
export const sameGeoRules = (a: GeoRules, b: GeoRules | null | undefined) => {
  const bb = b ?? {}
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(bb).length && keys.every((k) => a[k] === bb[k])
  )
}

/** First blocking problem with the geo drafts, or null. Mirrors the server
    validators (PR #230): one rule per country, at most 50 countries, and
    each URL through the same checks as the destination (length, format,
    spoo.me loops) — so saves never 400 blind. */
export function geoRulesProblem(rules: GeoRuleDraft[]): string | null {
  const seen = new Set<string>()
  for (const r of rules) {
    if (!/^[A-Z]{2}$/.test(r.country)) continue
    if (seen.has(r.country))
      return `${dimensionLabel("country", r.country)} has two rules. Each country gets one.`
    seen.add(r.country)
    if (looksLikeUrl(r.url)) {
      const bad = urlProblem(r.url)
      if (bad) return `${dimensionLabel("country", r.country)}: ${bad}`
    }
  }
  if (seen.size > GEO_RULES_MAX_COUNTRIES)
    return `At most ${GEO_RULES_MAX_COUNTRIES} country rules per link.`
  return null
}

export const completeVariants = (variants: VariantDraft[]): AbVariant[] =>
  variants
    .filter((v) => looksLikeUrl(v.url) && Number(v.weight) > 0)
    .map((v) => ({ url: normalizeUrl(v.url), weight: Number(v.weight) }))

export const variantTotal = (variants: VariantDraft[]) =>
  completeVariants(variants).reduce((a, v) => a + v.weight, 0)

/** Canonical wire payload (PR #231): undefined when nothing is set. The
    backend requires `title` on any meta_tags object, so a draft with only
    extras produces undefined too — metaTagsProblem flags that case before
    a save can drop it silently. */
export function metaTagsOf(m: MetaDraft): MetaTagsInput | undefined {
  const title = m.title.trim()
  if (!title) return undefined
  const image = m.image.trim()
  return {
    title,
    ...(m.description.trim() ? { description: m.description.trim() } : {}),
    // Data URIs travel verbatim (the upload path); URLs get the forgiving
    // scheme fill like every other URL input.
    ...(image
      ? { image: isMetaImageDataUri(image) ? image : normalizeUrl(image) }
      : {}),
    ...(metaColorValid(m.color) ? { color: m.color.toLowerCase() } : {}),
  }
}

/** Payload-vs-echo equality: the server echoes every field with explicit
    nulls (plus `warnings`, which the client never sends), so compare the
    four client-settable fields only. */
export const sameMetaTags = (
  a: MetaTagsInput | null,
  b: MetaTags | MetaTagsInput | null | undefined
) =>
  (a?.title ?? null) === (b?.title ?? null) &&
  (a?.description ?? null) === (b?.description ?? null) &&
  (a?.image ?? null) === (b?.image ?? null) &&
  (a?.color ?? null) === (b?.color ?? null)

/** First blocking problem with the meta draft, or null. Mirrors the server
    DTO rules (PR #231): title mandatory (1–120) whenever anything is set,
    description ≤240, image https-only / no SVG / ≤2048 chars OR a
    png/jpeg/webp data URI ≤512KB decoded (the 2048 cap is for URLs only),
    color #RRGGBB — so saves never 422 blind. */
export function metaTagsProblem(m: MetaDraft): string | null {
  const title = m.title.trim()
  const hasExtras = Boolean(
    m.description.trim() || m.image.trim() || m.color.trim()
  )
  if (!title && !hasExtras) return null
  if (!title)
    return "Give the preview a title. Cards without one render broken."
  if (title.length > META_TITLE_MAX)
    return `The title is too long (${META_TITLE_MAX} characters max).`
  if (m.description.trim().length > META_DESCRIPTION_MAX)
    return `The description is too long (${META_DESCRIPTION_MAX} characters max).`
  const image = m.image.trim()
  if (image && isMetaImageDataUri(image)) {
    // Normally unreachable — the upload path validates before it writes —
    // but a guard keeps a pasted or stale data URI from 400ing blind.
    if (!validMetaImageDataUri(image))
      return "The image must be a png, jpeg, or webp under 512KB."
  } else if (image) {
    const url = normalizeUrl(image)
    if (!looksLikeUrl(image) || !/^https:\/\//.test(url))
      return "The image must be an https:// URL."
    if (url.length > META_IMAGE_URL_MAX)
      return `The image URL is too long (${META_IMAGE_URL_MAX.toLocaleString()} characters max).`
    try {
      if (new URL(url).pathname.toLowerCase().endsWith(".svg"))
        return "SVG images aren't supported; preview crawlers can't render them."
    } catch {
      return "The image must be an https:// URL."
    }
  }
  if (m.color.trim() && !metaColorValid(m.color.trim()))
    return "The theme color must be a #RRGGBB hex value."
  return null
}

export const emptyMetaDraft = (): MetaDraft => ({
  title: "",
  description: "",
  image: "",
  color: "",
})

export const metaDraftOf = (m: MetaTags | null | undefined): MetaDraft => ({
  title: m?.title ?? "",
  description: m?.description ?? "",
  image: m?.image ?? "",
  color: m?.color ?? "",
})

/** Fetched image the editor would accept: https, not SVG, within length.
    Anything else is dropped on prefill rather than planting a 422. */
function usableFetchedImage(img: string | null): string | null {
  if (!img || !img.startsWith("https://") || img.length > META_IMAGE_URL_MAX)
    return null
  try {
    if (new URL(img).pathname.toLowerCase().endsWith(".svg")) return null
  } catch {
    return null
  }
  return img
}

/** Destination fetch → display draft (Dub-model prefill). Every field is
    clamped to the editor's own limits so a fill can't plant a 422; absent
    data (no fetch yet, error, non-https destination) yields the empty
    draft so the fields fall back to their placeholders. */
export function prefillDraftOf(m: UrlMetadata | null | undefined): MetaDraft {
  if (!m) return emptyMetaDraft()
  return {
    title: (m.title ?? "").slice(0, META_TITLE_MAX),
    description: (m.description ?? "").slice(0, META_DESCRIPTION_MAX),
    image: usableFetchedImage(m.image) ?? "",
    color: m.color && metaColorValid(m.color) ? m.color : "",
  }
}

/** The fetch produced something the fields can mirror. The header state
    tag and its helper line show only then — an empty or unusable fetch
    stays quiet (the notice line already covers errors). */
export function prefillHasData(m: UrlMetadata | null | undefined): boolean {
  const d = prefillDraftOf(m)
  return Boolean(d.title || d.description || d.image || d.color)
}

/** Metadata fetch failure → notice line. The 422 unfetchable reason
    carries the upstream status ("… HTML page (status 403)"): a forbidden
    or challenged fetch means the DESTINATION refuses crawlers, which
    deserves its own line — writing tags by hand still works fine. */
export type MetaFetchNotice = string | { title: string; body: string }

export function metaFetchNotice(err: unknown): MetaFetchNotice {
  if (err instanceof SpooApiError) {
    if (err.isRateLimit)
      return "preview fetches are rate limited, try again in a minute"
    if (
      err.code === "unfetchable" &&
      /\b(?:status|http)\s*403\b|forbidden|challenge/i.test(err.message)
    )
      // The destination challenges OUR fetcher, not the social crawlers:
      // its own tags (if any) still unfurl when the link is shared. Only
      // the mirror here is blind — rendered as an info box, not an error.
      return {
        title: "this destination blocked our fetch of its meta tags",
        body: "if it serves its own tags, social platforms still show them as is. tags you write here replace them.",
      }
  }
  return "couldn't fetch a preview from this destination"
}

/* ---------------------------------------------------------- small chrome */

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="mb-2.5 font-medium text-foreground text-xs">
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground/70 text-xs">{hint}</p>}
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-mono text-[10px] text-muted-foreground/60">
      {children}
    </div>
  )
}

/** In-input restore affordance: copies the destination's fetched value
    back into one field of a still-custom card. The header's "Reset to
    destination" is the different, bigger move (back to live inherit). */
function RestoreBtn({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`Restore the destination's ${label}`}
      title={`Restore the destination's ${label}`}
      onClick={onClick}
      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground/60 transition-colors duration-150 hover:text-foreground"
    >
      <RotateCcw className="size-3.5" />
    </button>
  )
}

/* --------------------------------------------------------- country picker */

/** Full ISO 3166-1 list; names via Intl so no locale data ships. */
const COUNTRY_OPTIONS = (() => {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" })
    return Object.keys(getAlpha2Codes())
      .map((a2) => {
        try {
          return { a2, name: dn.of(a2) ?? a2 }
        } catch {
          return { a2, name: a2 }
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
})()

/** Searchable country picker: flag + name + code, palette-style rows. */
function CountrySelect({
  value,
  onChange,
}: {
  value: string
  onChange: (a2: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const valid = /^[A-Z]{2}$/.test(value)
  return (
    // modal: a parent dialog's scroll lock would otherwise eat wheel
    // events in the portaled list; a modal popover owns its own scope.
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Choose a country"
          className="flex h-9 w-40 shrink-0 items-center gap-1.5 rounded-lg border border-input px-2.5 text-xs transition-colors duration-150 hover:bg-accent/40 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          {valid ? (
            <>
              <DimensionIcon
                dimension="country"
                value={value}
                className="size-3.5 shrink-0"
              />
              <span className="min-w-0 flex-1 truncate text-left text-foreground">
                {dimensionLabel("country", value)}
              </span>
            </>
          ) : (
            <>
              <Globe
                className="size-3.5 shrink-0 text-muted-foreground/70"
                strokeWidth={1.75}
              />
              <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">
                Country
              </span>
            </>
          )}
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 p-0"
        onOpenAutoFocus={(e) => {
          // land focus in the search box, not on the first row
          e.preventDefault()
          ;(e.currentTarget as HTMLElement | null)
            ?.querySelector("input")
            ?.focus()
        }}
      >
        <CommandPrimitive className="flex flex-col">
          <CommandPrimitive.Input
            placeholder="Search countries…"
            className="h-9 w-full border-border/60 border-b bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground/60"
          />
          <CommandPrimitive.List className="max-h-56 overflow-y-auto p-1 [mask-image:linear-gradient(to_bottom,black,black_calc(100%-16px),transparent)]">
            <CommandPrimitive.Empty className="px-2.5 py-6 text-center text-muted-foreground text-xs">
              No countries found.
            </CommandPrimitive.Empty>
            {COUNTRY_OPTIONS.map(({ a2, name }) => (
              <CommandPrimitive.Item
                key={a2}
                value={`${name} ${a2}`}
                onSelect={() => {
                  onChange(a2)
                  setOpen(false)
                }}
                className="flex h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-xs data-[selected=true]:bg-accent/70"
              >
                <DimensionIcon
                  dimension="country"
                  value={a2}
                  className="size-3.5 shrink-0"
                />
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {name}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">
                  {a2}
                </span>
                {value === a2 && <Check className="size-3.5 shrink-0" />}
              </CommandPrimitive.Item>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------- geo rules */

export function GeoRulesEditor({
  rules,
  onChange,
}: {
  rules: GeoRuleDraft[]
  onChange: (rules: GeoRuleDraft[]) => void
}) {
  const problem = geoRulesProblem(rules)
  return (
    <div className="space-y-2">
      <span className="flex items-center gap-1.5">
        <SectionLabel>Geo targeting</SectionLabel>
        <InfoHint label="How geo targeting works">
          Matches the visitor&apos;s country at redirect time. One rule per
          country, up to 50; everyone else follows the destination.
        </InfoHint>
      </span>
      <p
        className={cn(
          "text-xs",
          problem ? "text-destructive" : "text-muted-foreground/70"
        )}
      >
        {problem ??
          "Visitors from a matched country are redirected to its URL instead of the destination."}
      </p>
      {rules.map((rule, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <CountrySelect
            value={rule.country}
            onChange={(a2) =>
              onChange(
                rules.map((r, j) => (j === i ? { ...r, country: a2 } : r))
              )
            }
          />
          <Input
            value={rule.url}
            onChange={(e) =>
              onChange(
                rules.map((r, j) =>
                  j === i ? { ...r, url: e.target.value } : r
                )
              )
            }
            placeholder={`destination for ${
              /^[A-Z]{2}$/.test(rule.country)
                ? dimensionLabel("country", rule.country)
                : "this country"
            }`}
            spellCheck={false}
            className="h-9 flex-1 font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove rule"
            onClick={() => onChange(rules.filter((_, j) => j !== i))}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        disabled={rules.length >= GEO_RULES_MAX_COUNTRIES}
        onClick={() => onChange([...rules, { country: "", url: "" }])}
      >
        <Plus data-icon="inline-start" />
        Add country rule
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------- variants */

export function VariantsEditor({
  variants,
  onChange,
}: {
  variants: VariantDraft[]
  onChange: (variants: VariantDraft[]) => void
}) {
  const total = variantTotal(variants)
  return (
    <div className="space-y-2">
      <span className="flex items-center gap-1.5">
        <SectionLabel>A/B testing</SectionLabel>
        <InfoHint label="How A/B testing works">
          Traffic splits between variant URLs by weight. Weights are relative
          shares, not percentages.
        </InfoHint>
      </span>
      <p
        className={cn(
          "text-xs",
          total > 100 ? "text-destructive" : "text-muted-foreground/70"
        )}
      >
        {total > 100
          ? `Variant weights add up to ${total}%. Keep the total at 100% or less.`
          : total > 0
            ? `Variants take ${total}% of traffic; the destination keeps ${100 - total}%. Stats stay per-variant.`
            : "Each variant takes its weight in traffic; the destination keeps the rest. Stats stay per-variant."}
      </p>
      {variants.map((variant, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={variant.url}
            onChange={(e) =>
              onChange(
                variants.map((v, j) =>
                  j === i ? { ...v, url: e.target.value } : v
                )
              )
            }
            placeholder={`https://example.com/variant-${String.fromCharCode(98 + i)}`}
            spellCheck={false}
            className="h-9 flex-1 font-mono text-xs"
          />
          <div className="relative shrink-0">
            <Input
              type="number"
              min={1}
              max={99}
              value={variant.weight}
              onChange={(e) =>
                onChange(
                  variants.map((v, j) =>
                    j === i ? { ...v, weight: e.target.value } : v
                  )
                )
              }
              placeholder="50"
              className="h-9 w-16 pr-6 font-mono text-xs"
            />
            <span className="absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-muted-foreground/60 text-xs">
              %
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove variant"
            onClick={() => onChange(variants.filter((_, j) => j !== i))}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => onChange([...variants, { url: "", weight: "" }])}
      >
        <Plus data-icon="inline-start" />
        Add variant
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------- meta tags */

const COLOR_PRESETS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#171717",
]

export function MetaTagsEditor({
  value,
  onChange,
  domain,
  alias,
  preview = "side",
  loading = false,
  notice,
  problem: problemProp,
  source,
}: {
  value: MetaDraft
  onChange: (value: MetaDraft) => void
  domain: string
  alias: string
  /** side: fields + preview rail (stacks below sm). below: always stacked. */
  preview?: "side" | "below"
  /** Destination fetch in flight: the fields pulse in place (opacity only,
      zero layout shift) — the fields themselves are the loading surface. */
  loading?: boolean
  /** Fetch-failure status: a quiet one-liner, or {title, body} for cases
      that deserve explanation (blocked destinations). Yields to any
      problem and to a rejected upload; rendered only when present. */
  notice?: MetaFetchNotice | null
  /** Validation override: pass null to suppress while an uncustomized
      prefill is display-only and never travels. undefined = compute here. */
  problem?: string | null
  /** The destination's fetched values. When set (customized card), fields
      that diverge from it grow an in-input restore affordance. */
  source?: MetaDraft
}) {
  const [previewOn, setPreviewOn] = React.useState<MetaPlatform>("x")
  // Rejected file picks (wrong type / oversize) never touch the draft, so
  // they report locally; any later image action supersedes the message.
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const colorValid = metaColorValid(value.color)
  const problem =
    problemProp === undefined ? metaTagsProblem(value) : problemProp
  const patch = (partial: Partial<MetaDraft>) => {
    if ("image" in partial) setUploadError(null)
    onChange({ ...value, ...partial })
  }

  const pickFile = (file: File) => {
    // file.size IS the decoded byte count — the wire cap is on decoded
    // bytes, not the (4/3 larger) base64 string.
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > META_IMAGE_MAX_BYTES
    ) {
      setUploadError("The image must be a png, jpeg, or webp under 512KB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => patch({ image: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const imageValue = value.image.trim()
  const imageUploaded = isMetaImageDataUri(imageValue)
  const noticeLine = typeof notice === "string" ? notice : null
  const noticeBox =
    notice && typeof notice === "object" && !problem && !uploadError
      ? notice
      : null
  const line = problem ?? uploadError ?? noticeLine
  // A field earns a restore affordance when the card is custom (source
  // set), the destination actually has a value there, and ours diverges.
  const restorable = (key: "title" | "description" | "image") =>
    source !== undefined &&
    source[key].trim() !== "" &&
    value[key].trim() !== source[key].trim()

  const fields = (
    <div className={cn("min-w-0 flex-1 space-y-5", loading && "animate-pulse")}>
      {/* Rendered only when there is something to say — problem > upload
          error > fetch notice — so the resting states carry no dead band. */}
      {line && (
        <p
          aria-live="polite"
          className={cn(
            "text-xs",
            problem || uploadError
              ? "text-destructive"
              : "text-muted-foreground/70"
          )}
        >
          {line}
        </p>
      )}
      {noticeBox && (
        <div
          aria-live="polite"
          className="space-y-1 rounded-lg border border-border/60 px-3.5 py-3"
        >
          <p className="flex items-center gap-2 text-foreground/80 text-xs">
            <Info className="size-3.5 shrink-0 text-muted-foreground" />
            {noticeBox.title}
          </p>
          <p className="pl-[22px] text-muted-foreground/70 text-xs">
            {noticeBox.body}
          </p>
        </div>
      )}
      <Field
        label="Social title"
        hint="Overrides the destination's Open Graph title."
      >
        <div className="relative">
          <Input
            value={value.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="From the destination"
            maxLength={META_TITLE_MAX}
            className={cn("h-9 text-xs", restorable("title") && "pr-8")}
          />
          {restorable("title") && (
            <RestoreBtn
              label="title"
              onClick={() => patch({ title: source!.title })}
            />
          )}
        </div>
      </Field>
      <Field
        label="Social description"
        hint="Shown under the title in link previews."
      >
        <div className="relative">
          <Input
            value={value.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="From the destination"
            maxLength={META_DESCRIPTION_MAX}
            className={cn("h-9 text-xs", restorable("description") && "pr-8")}
          />
          {restorable("description") && (
            <RestoreBtn
              label="description"
              onClick={() => patch({ description: source!.description })}
            />
          )}
        </div>
      </Field>
      <Field
        label="Social image"
        hint="Paste an https:// URL or upload a png, jpeg, or webp. 1200×630 works everywhere."
      >
        <div className="flex items-center gap-1.5">
          {imageUploaded ? (
            /* A raw data URI is unreadable garbage in a text input — show
               a quiet chip instead. Same h-9 as the input: zero shift. */
            <span className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-input px-3 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs">
                uploaded image ·{" "}
                {Math.max(1, Math.round(dataUriBytes(imageValue) / 1024))}
                KB
              </span>
              <button
                type="button"
                aria-label="Remove the uploaded image"
                onClick={() => patch({ image: "" })}
                className="shrink-0 text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ) : (
            <div className="relative min-w-0 flex-1">
              <Input
                value={value.image}
                onChange={(e) => patch({ image: e.target.value })}
                placeholder="https://example.com/og.png"
                spellCheck={false}
                className={cn(
                  "h-9 font-mono text-xs",
                  restorable("image") && "pr-8"
                )}
              />
              {restorable("image") && (
                <RestoreBtn
                  label="image"
                  onClick={() => patch({ image: source!.image })}
                />
              )}
            </div>
          )}
          {/* Typing a URL and uploading are alternatives; last action wins. */}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-9 shrink-0"
            aria-label="Upload an image"
            onClick={() => fileRef.current?.click()}
          >
            <Upload />
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) pickFile(f)
              // allow re-picking the same file after a remove
              e.target.value = ""
            }}
          />
        </div>
      </Field>
      <Field
        label="Theme color"
        hint="Tints the embed accent on Discord (theme-color)."
      >
        <div
          className="flex items-center gap-1.5"
          onFocus={() => setPreviewOn("discord")}
        >
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Pick a theme color"
                onClick={() => setPreviewOn("discord")}
                className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-input transition-colors duration-150 hover:bg-accent/40 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                style={
                  colorValid ? { backgroundColor: value.color } : undefined
                }
              >
                {!colorValid && (
                  <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Pipette className="size-3.5" strokeWidth={1.75} />
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-56 p-3"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="[&_.react-colorful]:h-44 [&_.react-colorful]:w-full [&_.react-colorful__hue]:mt-3 [&_.react-colorful__hue]:h-3 [&_.react-colorful__hue]:rounded-full [&_.react-colorful__pointer]:size-4 [&_.react-colorful__pointer]:border-2 [&_.react-colorful__saturation]:rounded-lg [&_.react-colorful__saturation]:border-0">
                <HexColorPicker
                  color={colorValid ? value.color : "#8b5cf6"}
                  onChange={(c) => patch({ color: c })}
                />
              </div>
              <p className="mt-2.5 text-center font-mono text-[11px] text-muted-foreground tabular-nums">
                {(colorValid ? value.color : "#8b5cf6").toUpperCase()}
              </p>
            </PopoverContent>
          </Popover>
          <Input
            value={value.color}
            onChange={(e) => {
              const v = e.target.value.trim()
              patch({ color: v && !v.startsWith("#") ? `#${v}` : v })
            }}
            placeholder="None"
            spellCheck={false}
            className="h-9 w-36 font-mono text-xs"
          />
          <span className="flex items-center gap-1">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Use ${c}`}
                onClick={() => {
                  patch({ color: c })
                  setPreviewOn("discord")
                }}
                className={cn(
                  "size-4 rounded-full border border-black/10 transition-transform duration-150 hover:scale-110 dark:border-white/20",
                  value.color === c && "ring-2 ring-ring ring-offset-1"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </span>
          {value.color && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear theme color"
              onClick={() => patch({ color: "" })}
            >
              <X />
            </Button>
          )}
        </div>
      </Field>
    </div>
  )

  const previewRail = (
    <div
      className={cn(
        "space-y-2",
        preview === "side" ? "w-full sm:w-60 sm:shrink-0" : "w-full"
      )}
    >
      <div className="flex h-7 items-center justify-between">
        <span className="flex items-center gap-1.5">
          <SectionLabel>Preview</SectionLabel>
          <InfoHint label="About this preview">
            Approximate preview; each platform renders unfurls a little
            differently.
          </InfoHint>
        </span>
        <Segmented
          value={previewOn}
          onChange={setPreviewOn}
          options={[
            { value: "x", icon: FaXTwitter, ariaLabel: "X" },
            { value: "whatsapp", icon: FaWhatsapp, ariaLabel: "WhatsApp" },
            { value: "discord", icon: FaDiscord, ariaLabel: "Discord" },
            { value: "slack", icon: FaSlack, ariaLabel: "Slack" },
            { value: "linkedin", icon: FaLinkedinIn, ariaLabel: "LinkedIn" },
          ]}
        />
      </div>
      <MetaPreview
        platform={previewOn}
        title={value.title}
        description={value.description}
        image={value.image}
        domain={domain}
        alias={alias}
        color={colorValid ? value.color : undefined}
      />
    </div>
  )

  if (preview === "below") {
    return (
      <div className="space-y-5">
        {fields}
        {previewRail}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      {fields}
      {previewRail}
    </div>
  )
}
