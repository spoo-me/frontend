"use client"

import * as React from "react"

import { trackWaitlistJoined } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * The Business interest form: one button that swaps for email plus an
 * optional note, then one quiet confirmation line. No backend exists for
 * this yet; the `waitlist_joined` event is the list.
 */
export function WaitlistForm({
  defaultEmail = "",
  buttonClassName,
}: {
  defaultEmail?: string
  buttonClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState(defaultEmail)
  const [note, setNote] = React.useState("")
  const [invalid, setInvalid] = React.useState(false)
  const [joined, setJoined] = React.useState(false)
  if (joined)
    return (
      <p
        role="status"
        className="flex h-9 items-center font-mono text-[11px] text-muted-foreground"
      >
        You are on the list. We email you when Business opens.
      </p>
    )
  if (!open)
    return (
      <Button
        variant="outline"
        className={cn("w-full", buttonClassName)}
        onClick={() => setOpen(true)}
      >
        Join the waitlist
      </Button>
    )
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!/\S+@\S+\.\S+/.test(email)) {
          setInvalid(true)
          return
        }
        trackWaitlistJoined({ plan: "business", email, note: note.trim() })
        setJoined(true)
      }}
    >
      <Input
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@company.com"
        aria-label="Email for the Business waitlist"
        aria-invalid={invalid || undefined}
        autoFocus
        value={email}
        onChange={(e) => {
          setInvalid(false)
          setEmail(e.target.value)
        }}
        className="font-mono text-xs"
      />
      <Input
        name="note"
        placeholder="What would you use it for (optional)"
        aria-label="What would you use Business for"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="text-xs"
      />
      <Button
        type="submit"
        variant="outline"
        className={cn("w-full", buttonClassName)}
      >
        Join the waitlist
      </Button>
    </form>
  )
}
