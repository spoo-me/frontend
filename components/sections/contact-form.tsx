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
        <h2 className="font-semibold text-foreground text-lg tracking-tight">
          Send us a message
        </h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Fill out the form and we&apos;ll get back to you within 24 hours.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            name="name"
            placeholder="Ada Lovelace"
            className="h-10"
          />
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
        <div className="flex h-10 items-center rounded-lg border border-input bg-transparent shadow-soft transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <span className="select-none border-input border-r px-2.5 font-mono text-[13px] text-muted-foreground/70">
            https://
          </span>
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="acme.dev"
            className="h-full w-full bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </Field>

      <Field label="Topic" htmlFor="topic">
        <div className="relative">
          <select
            id="topic"
            name="topic"
            defaultValue="General question"
            className="h-10 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-soft outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] [&>option]:bg-background"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </Field>

      <Field label="Message" htmlFor="message">
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us what's on your mind…"
          className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-soft outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="max-w-[16rem] text-muted-foreground text-xs leading-relaxed">
          By sending, you agree to our privacy policy. We never share your
          message.
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
      <label htmlFor={htmlFor} className="font-medium text-foreground text-sm">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal text-muted-foreground/70 text-xs">
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  )
}
