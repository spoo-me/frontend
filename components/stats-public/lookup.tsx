"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Accepts whatever a user pastes — a full short URL (with or without
 * scheme), a bare code, an emoji alias, a preview URL with its trailing
 * `+` — and reduces it to the code segment.
 */
function parseCode(raw: string): string | null {
  let value = raw.trim()
  if (!value) return null
  if (value.includes("/") || value.includes(".")) {
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`)
      const segment = url.pathname.split("/").filter(Boolean)[0] ?? ""
      value = decodeURIComponent(segment)
    } catch {
      // not URL-shaped after all — treat it as a bare code
    }
  }
  value = value.replace(/\+$/, "")
  return value || null
}

export function StatsLookup() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [pending, startTransition] = useTransition()
  const code = parseCode(value)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!code) return
    startTransition(() => {
      router.push(`/stats/${encodeURIComponent(code)}`)
    })
  }

  return (
    <form onSubmit={submit} className="flex w-full gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="spoo.me/code"
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
    </form>
  )
}
