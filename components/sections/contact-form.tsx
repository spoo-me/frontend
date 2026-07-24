"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Send } from "@/components/icons"

import { useCaptcha } from "@/hooks/use-captcha"
import { trackUiAction } from "@/lib/analytics"
import {
  type IntakeErrorCopy,
  intakeErrorText,
  sendContactMessage,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

const topics = [
  "General question",
  "Bug report",
  "Feature idea",
  "Billing",
  "Partnership",
  "Security",
] as const

/** The wire takes {email, message}; name/website/topic ride inside the
    message body so the webhook embed keeps the context. */
const MESSAGE_MAX = 4000

export function ContactForm() {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [topic, setTopic] = React.useState<string>(topics[0])
  const [message, setMessage] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [status, setStatus] = React.useState<
    { kind: "idle" } | { kind: "sent" } | { kind: "error"; text: string }
  >({ kind: "idle" })
  const captcha = useCaptcha()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setStatus({ kind: "error", text: "Enter a valid email so we can reply." })
      return
    }
    if (!message.trim()) {
      setStatus({ kind: "error", text: "Write a message first." })
      return
    }
    const header = [
      `Topic: ${topic}`,
      ...(name.trim() ? [`Name: ${name.trim()}`] : []),
      ...(website.trim() ? [`Website: https://${website.trim()}`] : []),
    ].join("\n")
    const compiled = `${header}\n\n${message.trim()}`
    if (compiled.length > MESSAGE_MAX) {
      setStatus({
        kind: "error",
        text: `That message is too long. Keep it under ${MESSAGE_MAX.toLocaleString()} characters.`,
      })
      return
    }

    setPending(true)
    setStatus({ kind: "idle" })
    try {
      // One invisible challenge per submission; skipped when no sitekey
      // is configured (the backend then doesn't expect a token either).
      const captcha_token = await captcha.challenge()
      await sendContactMessage({
        email: email.trim(),
        message: compiled,
        ...(captcha_token ? { captcha_token } : {}),
      })
      trackUiAction("contact_submitted")
      setStatus({ kind: "sent" })
      setMessage("") // identity fields stay; a resend shouldn't retype them
    } catch (err) {
      setStatus({ kind: "error", text: intakeErrorText(err, ERROR_COPY) })
    } finally {
      setPending(false)
    }
  }

  return (
    // noValidate: the status slot below carries validation copy in the
    // house voice — native browser bubbles would race it.
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <h2 className="font-semibold text-foreground text-lg tracking-tight">
          Send us a message
        </h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Fill out the form and we&apos;ll get back to you within 24 hours.
          Reporting a malicious link?{" "}
          <Link
            href="/report"
            className="text-foreground underline underline-offset-4 transition-colors duration-150 hover:text-foreground/80"
          >
            The report form
          </Link>{" "}
          is faster.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            name="name"
            placeholder="Ada Lovelace"
            className="h-10"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ada@example.com"
            className="h-10"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Company website" htmlFor="website" optional>
        <div className="flex h-10 items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
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
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      </Field>

      <Field label="Topic" htmlFor="topic">
        <NativeSelect
          id="topic"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="Message" htmlFor="message">
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          maxLength={MESSAGE_MAX}
          placeholder="Tell us what's on your mind…"
          className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>

      {/* Fixed-height status slot — errors and the sent ack swap in place,
          nothing below ever moves. */}
      <p role="status" aria-live="polite" className="-my-1 h-4 text-xs">
        {status.kind === "error" ? (
          <span className="text-destructive">{status.text}</span>
        ) : status.kind === "sent" ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Check aria-hidden className="size-3.5 text-live" />
            Message sent. We reply to {email.trim() || "your email"}, usually
            within 24 hours.
          </span>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="max-w-[16rem] text-muted-foreground text-xs leading-relaxed">
          By sending, you agree to our privacy policy. We never share your
          message.
        </p>
        <Button
          type="submit"
          size="lg"
          className="h-10 px-4"
          disabled={pending}
        >
          <Send className="size-4" data-icon="inline-start" />
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>

      {captcha.element}
    </form>
  )
}

/** This surface's wording for the shared intake error ladder. */
const ERROR_COPY: IntakeErrorCopy = {
  captchaIncomplete: "The captcha wasn't completed. Try sending again.",
  captchaRejected: "The captcha didn't verify. Try sending again.",
  notConfigured:
    "The contact form is down on our side. Email hello@spoo.me instead.",
  rateLimited: "Too many messages just now. Wait a minute and try again.",
  network: "Can't reach the server. Check your connection and try again.",
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
