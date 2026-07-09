"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd, useModKey } from "@/components/dashboard/kbd"

const OPEN_EVENT = "spoo:shortcuts-help"

/** Imperative opener so the palette (or anything else) can summon it. */
export function openShortcutsHelp() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

function Row({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex h-8 items-center justify-between">
      <span className="text-foreground text-[13px]">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <Kbd key={i}>{k}</Kbd>
        ))}
      </span>
    </div>
  )
}

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="label-mono text-muted-foreground/60 mb-2 block">
        {title}
      </div>
      {children}
    </div>
  )
}

export function ShortcutsHelp() {
  const [open, setOpen] = React.useState(false)
  const mod = useModKey()

  React.useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Available anywhere in the dashboard unless noted.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Group title="Global">
            <Row label="Command palette" keys={[mod, "K"]} />
            <Row label="New link" keys={["N"]} />
            <Row label="Search" keys={["/"]} />
            <Row label="This overlay" keys={["?"]} />
            <Row label="Dismiss / clear" keys={["Esc"]} />
          </Group>
          <Group title="Go to">
            <Row label="Overview" keys={["G", "O"]} />
            <Row label="Links" keys={["G", "L"]} />
            <Row label="Analytics" keys={["G", "A"]} />
            <Row label="Domains" keys={["G", "D"]} />
            <Row label="Apps" keys={["G", "P"]} />
            <Row label="API keys" keys={["G", "K"]} />
          </Group>
          <Group title="Links page">
            <Row label="Previous / next page" keys={["←", "→"]} />
            <Row label="Select all on page" keys={[mod, "A"]} />
          </Group>
          <Group title="New link dialog">
            <Row label="Switch tab" keys={[mod, "1-4"]} />
            <Row label="Create link" keys={[mod, "↵"]} />
          </Group>
        </div>
      </DialogContent>
    </Dialog>
  )
}
