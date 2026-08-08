"use client"

import * as React from "react"
import {
  AppWindow,
  Compass,
  Globe,
  MapPin,
  MonitorSmartphone,
  MoveUpRight,
} from "lucide-react"
import { FaWindows } from "react-icons/fa6"
import { SiAndroid, SiApple, SiLinux } from "react-icons/si"

import { cn } from "@/lib/utils"
import { faviconUrl } from "@/lib/favicon"

/**
 * Identity icons for dimension values: favicons for referrers, flags for
 * countries, neutral glyph fallbacks elsewhere. The icon carries identity
 * color, so surrounding chrome stays neutral.
 */

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" })

export function countryName(code: string) {
  if (code.length !== 2) return code
  try {
    return COUNTRY_NAMES.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

function Favicon({
  domain,
  className,
}: {
  domain: string
  className?: string
}) {
  const [failed, setFailed] = React.useState(false)
  if (failed)
    return (
      <Globe
        className={cn("text-muted-foreground", className)}
        strokeWidth={1.75}
      />
    )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl(domain)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("rounded-[4px]", className)}
    />
  )
}

function Flag({ code, className }: { code: string; className?: string }) {
  const [failed, setFailed] = React.useState(false)
  if (failed || code.length !== 2)
    return (
      <MapPin
        className={cn("text-muted-foreground", className)}
        strokeWidth={1.75}
      />
    )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("rounded-[3px] object-cover", className)}
    />
  )
}

export function DimensionIcon({
  dimension,
  value,
  className = "size-4",
}: {
  dimension: string
  value: string
  className?: string
}) {
  switch (dimension) {
    case "referrer":
      if (value === "direct")
        return (
          <MoveUpRight
            className={cn("text-muted-foreground", className)}
            strokeWidth={1.75}
          />
        )
      return <Favicon domain={value} className={className} />
    case "country":
      return <Flag code={value} className={className} />
    case "city":
      return (
        <MapPin
          className={cn("text-muted-foreground", className)}
          strokeWidth={1.75}
        />
      )
    case "browser":
      return <BrowserLogo name={value} className={className} />
    case "os":
      return <OsGlyph name={value} className={className} />
    default:
      return (
        <AppWindow
          className={cn("text-muted-foreground", className)}
          strokeWidth={1.75}
        />
      )
  }
}

/**
 * Browsers: official colored marks (alrra/browser-logos, the caniuse set) —
 * image carries identity color, same treatment as favicons/flags.
 */
const BROWSER_SLUGS: Record<string, string> = {
  chrome: "chrome",
  safari: "safari",
  firefox: "firefox",
  edge: "edge",
  opera: "opera",
  brave: "brave",
  arc: "arc",
  vivaldi: "vivaldi",
  "samsung internet": "samsung-internet",
  duckduckgo: "duckduckgo",
  chromium: "chromium",
}

/** Marks missing from browser-logos, served brand-colored by simpleicons. */
const SIMPLEICON_BROWSERS: Record<string, string> = { arc: "arc" }

function BrowserLogo({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const [failed, setFailed] = React.useState(false)
  const key = name.toLowerCase()
  const slug = BROWSER_SLUGS[key]
  const siSlug = SIMPLEICON_BROWSERS[key]
  const src = siSlug
    ? `https://cdn.simpleicons.org/${siSlug}`
    : slug
      ? `https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/${slug}/${slug}_64x64.png`
      : null
  if (!src || failed)
    return (
      <Compass
        className={cn("text-muted-foreground", className)}
        strokeWidth={1.75}
      />
    )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}

/**
 * OS: monochrome brand glyphs in foreground ink (Windows comes from the fa
 * set — simple-icons dropped Microsoft marks). Deliberate contrast with the
 * colored browser marks: OS names are recognizable by shape alone.
 */
const OS_GLYPHS: Record<string, React.ElementType> = {
  android: SiAndroid,
  windows: FaWindows,
  linux: SiLinux,
  macos: SiApple,
  ios: SiApple,
}

function OsGlyph({ name, className }: { name: string; className?: string }) {
  const Icon = OS_GLYPHS[name.toLowerCase()]
  if (!Icon)
    return (
      <MonitorSmartphone
        className={cn("text-muted-foreground", className)}
        strokeWidth={1.75}
      />
    )
  return <Icon className={cn("text-foreground", className)} />
}

export function dimensionLabel(dimension: string, value: string) {
  if (dimension === "country") return countryName(value)
  if (dimension === "referrer" && value === "direct") return "Direct / none"
  return value
}
