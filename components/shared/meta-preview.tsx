"use client"

import * as React from "react"
import { ImageIcon } from "lucide-react"

import { normalizeUrl } from "@/lib/validation"

export type MetaPlatform = "x" | "whatsapp" | "discord" | "linkedin" | "slack"

const looksLikeUrl = (raw: string) => {
  try {
    return new URL(normalizeUrl(raw)).hostname.includes(".")
  } catch {
    return false
  }
}

/** Evocative, not pixel-faithful: enough of each platform's unfurl anatomy
    to judge the tags. Fallback copy marks what the destination provides. */
export function MetaPreview({
  platform,
  title,
  description,
  image,
  domain,
  alias = "",
  url,
  color,
  emptyTitle = "Title from the destination",
  emptyDescription = "Description from the destination.",
}: {
  platform: MetaPlatform
  title: string
  description: string
  image: string
  domain: string
  alias?: string
  /** Full link shown in the WhatsApp bubble; defaults to the spoo alias. */
  url?: string
  color?: string
  emptyTitle?: string
  emptyDescription?: string
}) {
  // Keyed to the src it failed on — a new URL gets a fresh chance without
  // any effect-driven reset.
  const [brokenSrc, setBrokenSrc] = React.useState<string | null>(null)
  // Data URIs (the upload path) render as-is; URLs get the scheme fill.
  const imgSrc =
    image && brokenSrc !== image
      ? image.startsWith("data:")
        ? image
        : looksLikeUrl(image)
          ? normalizeUrl(image)
          : null
      : null
  const t = title || emptyTitle
  const d = description || emptyDescription

  const img = imgSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt=""
      onError={() => setBrokenSrc(image)}
      className="aspect-[1.91/1] w-full object-cover"
    />
  ) : (
    <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-muted/60 text-muted-foreground/40">
      <ImageIcon className="size-5" strokeWidth={1.5} />
    </div>
  )

  if (platform === "x") {
    return (
      <div>
        <div className="relative overflow-hidden rounded-xl border border-border/60">
          {img}
          <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            {t}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
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
          <p className="truncate font-semibold text-[#006ce7] text-[11px] dark:text-[#00a8fc]">
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
      <div className="overflow-hidden rounded-sm border border-border/60">
        {img}
        <div className="bg-[#eef3f8] px-2.5 py-2 dark:bg-neutral-800">
          <p className="truncate font-semibold text-[11px] text-neutral-900 dark:text-neutral-100">
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
          <p className="font-bold text-[11px] text-neutral-800 dark:text-neutral-200">
            {domain}
          </p>
          <p className="truncate font-semibold text-[#1264a3] text-[11px] dark:text-[#4c9ee8]">
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
          <p className="truncate font-medium text-[11px] text-neutral-900 dark:text-neutral-100">
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
      <p className="truncate px-1 pt-1 text-[#1976d2] text-[11px] underline dark:text-[#53bdeb]">
        {url ?? `https://${domain}/${alias || "…"}`}
      </p>
    </div>
  )
}
