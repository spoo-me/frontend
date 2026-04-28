"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { siteConfig } from "@/lib/site-config"

export function StatusBadge() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const theme = !mounted || resolvedTheme !== "light" ? "dark" : "light"

  return (
    <a
      href={siteConfig.links.status}
      target="_blank"
      rel="noreferrer"
      aria-label="System status"
      className="inline-block opacity-90 transition hover:opacity-100"
    >
      <iframe
        key={theme}
        src={`https://status.spoo.me/badge?theme=${theme}`}
        width="250"
        height="30"
        title="spoo.me status"
        className="block"
        style={{ colorScheme: "normal" }}
        scrolling="no"
      />
    </a>
  )
}
