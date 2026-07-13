import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Short-code redirects are excluded via X-Robots-Tag at the origin,
      // not here — the code namespace can't be expressed as path rules.
      disallow: ["/dashboard", "/onboarding", "/api/", "/relay/", "/_error/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
