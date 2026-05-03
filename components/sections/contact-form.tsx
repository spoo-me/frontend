"use client"

import * as React from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ContactForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="border-border/60 bg-card/40 flex flex-col gap-6 rounded-2xl border p-7 sm:p-9"
    >
      <div>
        <h3 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
          Send us a message
        </h3>
        <p className="text-muted-foreground mt-1.5 text-sm">
          For everything that doesn&apos;t fit a channel above. We respond within a business day.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input id="name" name="name" placeholder="Ada Lovelace" className="h-10" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ada@example.com"
            className="h-10"
          />
        </Field>
      </div>

      <Field label="Subject" htmlFor="subject">
        <Input
          id="subject"
          name="subject"
          placeholder="What's this about?"
          className="h-10"
        />
      </Field>

      <Field label="Message" htmlFor="message">
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us what's on your mind…"
          className="border-border/60 bg-background/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30"
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-muted-foreground text-xs">
          By sending, you agree to our privacy policy. We never share your message.
        </p>
        <Button type="submit" size="lg" className="h-10 px-4">
          <Send className="size-4" data-icon="inline-start" />
          Send message
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-foreground text-xs font-semibold uppercase tracking-[0.16em]"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
