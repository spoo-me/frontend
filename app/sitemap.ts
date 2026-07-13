import type { MetadataRoute } from "next"

import { connectedApps } from "@/lib/apps-data"
import { PRICING_ENABLED } from "@/lib/flags"
import { siteConfig } from "@/lib/site-config"
import { testimonials } from "@/lib/testimonials"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/about",
    "/apps",
    "/testimonials",
    "/contact",
    "/report",
    "/privacy",
    "/terms",
    "/legal",
    // Bare /stats is the legacy lookup form, served by the backend on the
    // same host — still a public page of this site.
    "/stats",
    ...(PRICING_ENABLED ? ["/pricing"] : []),
  ]

  return [
    ...staticPaths.map((path) => ({
      url: `${siteConfig.url}${path}`,
      priority: path === "" ? 1 : 0.8,
    })),
    ...connectedApps.map((app) => ({
      url: `${siteConfig.url}/apps/${app.slug}`,
      priority: 0.6,
    })),
    ...testimonials.map((t) => ({
      url: `${siteConfig.url}/testimonials/${t.slug}`,
      priority: 0.5,
    })),
  ]
}
