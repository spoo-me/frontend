"use client"

import * as React from "react"
import { ChevronDown, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const topics = [
  "General question",
  "Bug report",
  "Feature idea",
  "Billing",
  "Partnership",
  "Security",
] as const

export function ContactForm() {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
      <div>
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          Send us a message
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Fill out the form and we&apos;ll get back to you within 24 hours.
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

      <Field label="Company website" htmlFor="website" optional>
        <div className="border-input shadow-soft focus-within:border-ring focus-within:ring-ring/50 flex h-10 items-center rounded-lg border bg-transparent transition-colors focus-within:ring-3 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <span className="text-muted-foreground/70 border-input border-r px-2.5 font-mono text-[13px] select-none">
            https://
          </span>
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="acme.dev"
            className="placeholder:text-muted-foreground h-full w-full bg-transparent px-2.5 text-sm outline-none"
          />
        </div>
      </Field>

      <Field label="Topic" htmlFor="topic">
        <div className="relative">
          <select
            id="topic"
            name="topic"
            defaultValue="General question"
            className="border-input shadow-soft focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full appearance-none rounded-lg border bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] [&>option]:bg-background"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
          />
        </div>
      </Field>

      <Field label="Message" htmlFor="message">
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us what's on your mind…"
          className="border-input shadow-soft placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-muted-foreground max-w-[16rem] text-xs leading-relaxed">
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
  optional,
  children,
}: {
  label: string
  htmlFor: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-foreground text-sm font-medium">
        {label}
        {optional && (
          <span className="text-muted-foreground/70 ml-1.5 text-xs font-normal">
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  )
}
