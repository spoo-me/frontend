"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Hosts whose links resolve in this deployment's stats namespace. */
const SYSTEM_HOSTS = new Set(["spoo.me", "www.spoo.me", "beta.spoo.me"])

type Parsed =
  | { code: string; foreignHost: null }
  | { code: null; foreignHost: string | null }

/**
 * Accepts whatever a user pastes — a full short URL (with or without
 * scheme), a bare code, an emoji alias, a preview URL with its trailing
 * `+` — and reduces it to the code segment. Custom-domain links are
 * refused rather than resolved: public stats tenant-scope by Host, so
 * looking their code up here would answer from the wrong namespace.
 */
function parse(raw: string, currentHost: string): Parsed {
  let value = raw.trim()
  if (!value) return { code: null, foreignHost: null }
  if (value.includes("/") || value.includes(".")) {
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`)
      const host = url.hostname.toLowerCase()
      if (host !== currentHost && !SYSTEM_HOSTS.has(host)) {
        return { code: null, foreignHost: host }
      }
      const segment = url.pathname.split("/").filter(Boolean)[0] ?? ""
      value = decodeURIComponent(segment)
    } catch {
      // not URL-shaped after all — treat it as a bare code
    }
  }
  value = value.replace(/\+$/, "")
  return value
    ? { code: value, foreignHost: null }
    : { code: null, foreignHost: null }
}

export function StatsLookup() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [pending, startTransition] = useTransition()
  const { code, foreignHost } = parse(
    value,
    typeof window === "undefined" ? "" : window.location.hostname
  )

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!code) return
    startTransition(() => {
      router.push(`/stats/${encodeURIComponent(code)}`)
    })
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="spoo.me/abc123 or abc123"
          aria-label="Short link or code"
          autoFocus
          className="h-11 flex-1 font-mono text-[13px]"
        />
        <Button
          type="submit"
          size="lg"
          disabled={!code || pending}
          className="h-11"
        >
          View stats
          <ArrowRight className="size-4" />
        </Button>
      </div>
      {/* Fixed slot so the hint never shifts the layout. */}
      <p className="mt-2 h-4 text-left font-mono text-[11px] text-muted-foreground/70">
        {foreignHost ? `no public stats for links on ${foreignHost}` : ""}
      </p>
    </form>
  )
}
