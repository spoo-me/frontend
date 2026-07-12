"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

type Step = { label: string; command: string }

export function InstallSteps({ install }: { install?: Step[] }) {
  if (!install?.length) return null
  return (
    <ul className="flex flex-col gap-2">
      {install.map((step) => (
        <InstallRow key={step.label} step={step} />
      ))}
    </ul>
  )
}

function InstallRow({ step }: { step: Step }) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    await navigator.clipboard.writeText(step.command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5 shadow-soft dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0 flex-1">
        <div className="label-mono text-muted-foreground">{step.label}</div>
        <code className="mt-1 block truncate font-mono text-foreground/90 text-xs">
          {step.command}
        </code>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy: ${step.command}`}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 text-live" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </li>
  )
}
