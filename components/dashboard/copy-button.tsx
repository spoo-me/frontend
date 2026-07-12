"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { trackUiAction, type UiAction } from "@/lib/analytics"

/** Copy affordance for aliases/keys/DNS values (DIRECTION §6 floor). */
export function CopyButton({
  value,
  label = "Copy",
  trackAs,
  className,
}: {
  value: string
  label?: string
  /** Analytics action to emit on copy; untracked when omitted. */
  trackAs?: UiAction
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    await navigator.clipboard.writeText(value)
    if (trackAs) trackUiAction(trackAs)
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-150 hover:bg-accent/60 hover:text-foreground",
        copied && "text-live hover:text-live",
        className
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}
