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
    <li className="border-border/60 bg-card/40 shadow-soft flex items-center gap-3 rounded-lg border px-3 py-2.5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0 flex-1">
        <div className="label-mono text-muted-foreground">{step.label}</div>
        <code className="text-foreground/90 mt-1 block truncate font-mono text-xs">
          {step.command}
        </code>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy: ${step.command}`}
        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
      >
        {copied ? <Check className="text-live size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </li>
  )
}
