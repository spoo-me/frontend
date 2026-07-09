"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { getAlpha2Codes } from "i18n-iso-countries"
import { HexColorPicker } from "react-colorful"
import {
  Check,
  ChevronDown,
  Globe,
  ImageIcon,
  Pipette,
  Plus,
  X,
} from "lucide-react"
import {
  FaDiscord,
  FaLinkedinIn,
  FaSlack,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6"

import { cn } from "@/lib/utils"
import type { AbVariant, GeoRule, MetaTags } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
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

export const completeGeoRules = (rules: GeoRuleDraft[]): GeoRule[] =>
  rules
    .filter((r) => /^[A-Z]{2}$/.test(r.country) && looksLikeUrl(r.url))
    .map((r) => ({ country: r.country, url: normalizeUrl(r.url) }))

export const completeVariants = (variants: VariantDraft[]): AbVariant[] =>
  variants
    .filter((v) => looksLikeUrl(v.url) && Number(v.weight) > 0)
    .map((v) => ({ url: normalizeUrl(v.url), weight: Number(v.weight) }))

export const variantTotal = (variants: VariantDraft[]) =>
  completeVariants(variants).reduce((a, v) => a + v.weight, 0)

/** Canonical payload from a meta draft; undefined when nothing is set. */
export function metaTagsOf(m: MetaDraft): MetaTags | undefined {
  const out: MetaTags = {
    ...(m.title ? { title: m.title } : {}),
    ...(m.description ? { description: m.description } : {}),
    ...(m.image ? { image: normalizeUrl(m.image) } : {}),
    ...(metaColorValid(m.color) ? { color: m.color.toLowerCase() } : {}),
  }
  return Object.keys(out).length ? out : undefined
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
      <Label className="text-foreground mb-2.5 text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground/70 text-xs">{hint}</p>}
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-mono text-muted-foreground/60 text-[10px]">
      {children}
    </div>
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
          className="shadow-soft border-input hover:bg-accent/40 dark:bg-input/30 flex h-9 w-40 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors duration-150 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          {valid ? (
            <>
              <DimensionIcon
                dimension="country"
                value={value}
                className="size-3.5 shrink-0"
              />
              <span className="text-foreground min-w-0 flex-1 truncate text-left">
                {dimensionLabel("country", value)}
              </span>
            </>
          ) : (
            <>
              <Globe
                className="text-muted-foreground/70 size-3.5 shrink-0"
                strokeWidth={1.75}
              />
              <span className="text-muted-foreground min-w-0 flex-1 truncate text-left">
                Country
              </span>
            </>
          )}
          <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
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
            className="placeholder:text-muted-foreground/60 border-border/60 h-9 w-full border-b bg-transparent px-3 text-xs outline-none"
          />
          <CommandPrimitive.List className="max-h-56 overflow-y-auto p-1 [mask-image:linear-gradient(to_bottom,black,black_calc(100%-16px),transparent)]">
            <CommandPrimitive.Empty className="text-muted-foreground px-2.5 py-6 text-center text-xs">
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
                className="data-[selected=true]:bg-accent/70 flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-xs select-none"
              >
                <DimensionIcon
                  dimension="country"
                  value={a2}
                  className="size-3.5 shrink-0"
                />
                <span className="text-foreground min-w-0 flex-1 truncate">
                  {name}
                </span>
                <span className="text-muted-foreground/60 shrink-0 font-mono text-[10px]">
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
  return (
    <div className="space-y-2">
      <SectionLabel>Geo targeting</SectionLabel>
      <p className="text-muted-foreground/70 text-xs">
        Visitors from a matched country are redirected to its URL instead of
        the destination.
      </p>
      {rules.map((rule, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <CountrySelect
            value={rule.country}
            onChange={(a2) =>
              onChange(rules.map((r, j) => (j === i ? { ...r, country: a2 } : r)))
            }
          />
          <Input
            value={rule.url}
            onChange={(e) =>
              onChange(
                rules.map((r, j) =>
                  j === i ? { ...r, url: e.target.value } : r,
                ),
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
      <SectionLabel>A/B testing</SectionLabel>
      <p
        className={cn(
          "text-xs",
          total > 100 ? "text-destructive" : "text-muted-foreground/70",
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
                  j === i ? { ...v, url: e.target.value } : v,
                ),
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
                    j === i ? { ...v, weight: e.target.value } : v,
                  ),
                )
              }
              placeholder="50"
              className="h-9 w-16 pr-6 font-mono text-xs"
            />
            <span className="text-muted-foreground/60 absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-xs">
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

type MetaPlatform = "x" | "whatsapp" | "discord" | "linkedin" | "slack"

/** Evocative, not pixel-faithful: enough of each platform's unfurl anatomy
    to judge the tags. Fallback copy marks what the destination provides. */
function MetaPreview({
  platform,
  title,
  description,
  image,
  domain,
  alias,
  color,
}: {
  platform: MetaPlatform
  title: string
  description: string
  image: string
  domain: string
  alias: string
  color?: string
}) {
  // Keyed to the src it failed on — a new URL gets a fresh chance without
  // any effect-driven reset.
  const [brokenSrc, setBrokenSrc] = React.useState<string | null>(null)
  const imgSrc =
    image && looksLikeUrl(image) && brokenSrc !== image
      ? normalizeUrl(image)
      : null
  const t = title || "Title from the destination"
  const d = description || "Description from the destination."

  const img = imgSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt=""
      onError={() => setBrokenSrc(image)}
      className="aspect-[1.91/1] w-full object-cover"
    />
  ) : (
    <div className="bg-muted/60 text-muted-foreground/40 flex aspect-[1.91/1] w-full items-center justify-center">
      <ImageIcon className="size-5" strokeWidth={1.5} />
    </div>
  )

  if (platform === "x") {
    return (
      <div>
        <div className="border-border/60 relative overflow-hidden rounded-xl border">
          {img}
          <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            {t}
          </span>
        </div>
        <p className="text-muted-foreground/70 mt-1 text-[10px]">
          From {domain}
        </p>
      </div>
    )
  }

  if (platform === "discord") {
    return (
      <div className="flex overflow-hidden rounded-[4px] bg-[#f2f3f5] dark:bg-[#2b2d31]">
        <div
          className="w-1 shrink-0 bg-[#c4c9ce] dark:bg-[#1e1f22]"
          style={color ? { backgroundColor: color } : undefined}
        />
        <div className="min-w-0 flex-1 space-y-1 p-2.5 pl-2">
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
            {domain}
          </p>
          <p className="truncate text-[11px] font-semibold text-[#006ce7] dark:text-[#00a8fc]">
            {t}
          </p>
          <p className="line-clamp-2 text-[10px] text-neutral-700 dark:text-neutral-300">
            {d}
          </p>
          <div className="overflow-hidden rounded">{img}</div>
        </div>
      </div>
    )
  }

  if (platform === "linkedin") {
    return (
      <div className="border-border/60 overflow-hidden rounded-sm border">
        {img}
        <div className="bg-[#eef3f8] px-2.5 py-2 dark:bg-neutral-800">
          <p className="truncate text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t}
          </p>
          <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            {domain}
          </p>
        </div>
      </div>
    )
  }

  if (platform === "slack") {
    return (
      <div className="flex gap-2">
        <div className="w-1 shrink-0 rounded-full bg-[#dddddd] dark:bg-neutral-600" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
            {domain}
          </p>
          <p className="truncate text-[11px] font-semibold text-[#1264a3] dark:text-[#4c9ee8]">
            {t}
          </p>
          <p className="line-clamp-2 text-[10px] text-neutral-600 dark:text-neutral-300">
            {d}
          </p>
          <div className="max-w-[85%] overflow-hidden rounded-lg">{img}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg rounded-tl-none bg-[#d9fdd3] p-1 dark:bg-[#064e40]">
      <div className="overflow-hidden rounded-md bg-black/[0.045] dark:bg-white/[0.06]">
        {img}
        <div className="space-y-0.5 px-2 py-1.5">
          <p className="truncate text-[11px] font-medium text-neutral-900 dark:text-neutral-100">
            {t}
          </p>
          <p className="line-clamp-2 text-[10px] text-neutral-600 dark:text-neutral-300">
            {d}
          </p>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
            {domain}
          </p>
        </div>
      </div>
      <p className="truncate px-1 pt-1 text-[11px] text-[#1976d2] underline dark:text-[#53bdeb]">
        https://{domain}/{alias || "…"}
      </p>
    </div>
  )
}

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
}: {
  value: MetaDraft
  onChange: (value: MetaDraft) => void
  domain: string
  alias: string
  /** side: fields + preview rail (stacks below sm). below: always stacked. */
  preview?: "side" | "below"
}) {
  const [previewOn, setPreviewOn] = React.useState<MetaPlatform>("x")
  const colorValid = metaColorValid(value.color)
  const patch = (partial: Partial<MetaDraft>) =>
    onChange({ ...value, ...partial })

  const fields = (
    <div className="min-w-0 flex-1 space-y-5">
      <Field
        label="Social title"
        hint="Overrides the destination's Open Graph title."
      >
        <Input
          value={value.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="From the destination"
          className="h-9 text-xs"
        />
      </Field>
      <Field
        label="Social description"
        hint="Shown under the title in link previews."
      >
        <Input
          value={value.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="From the destination"
          className="h-9 text-xs"
        />
      </Field>
      <Field label="Social image" hint="1200×630 works everywhere.">
        <Input
          value={value.image}
          onChange={(e) => patch({ image: e.target.value })}
          placeholder="https://example.com/og.png"
          spellCheck={false}
          className="h-9 font-mono text-xs"
        />
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
                className="shadow-soft border-input hover:bg-accent/40 dark:bg-input/30 relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border transition-colors duration-150 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                style={
                  colorValid ? { backgroundColor: value.color } : undefined
                }
              >
                {!colorValid && (
                  <span className="text-muted-foreground absolute inset-0 flex items-center justify-center">
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
              <p className="text-muted-foreground mt-2.5 text-center font-mono text-[11px] tabular-nums">
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
                  value.color === c && "ring-ring ring-2 ring-offset-1",
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
        preview === "side" ? "w-full sm:w-60 sm:shrink-0" : "w-full",
      )}
    >
      <div className="flex h-7 items-center justify-between">
        <SectionLabel>Preview</SectionLabel>
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
