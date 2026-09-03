"use client"

import * as React from "react"
import { toast } from "sonner"

import { smallBurst } from "@/lib/confetti"

/** One smallBurst from the success toast. Zero-size marker inside the toast;
    it waits out sonner's slide-in, then bursts from the toast (the marker's
    closest li) so the origin tracks wherever the toast actually landed. */
function ToastConfetti() {
  const ref = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const el = ref.current
      if (!el) return
      smallBurst(el.closest("li") ?? el, {
        // Tilted toward the viewport: the toast sits in the corner.
        angle: 100,
        // Above sonner's 999999999 toaster, else the burst hides behind
        // the very toast it comes from (canvas-confetti defaults to 100).
        zIndex: 2147483647,
      })
    }, 350)
    return () => clearTimeout(t)
  }, [])
  return <span ref={ref} aria-hidden className="absolute" />
}

/** Action chip for the create toast. Copy feedback lives here, not in the
    toast title: the chip starts as "Copied" when the auto-copy landed,
    relaxes back to "Copy", and every press copies again. data-button opts
    into sonner's own action-chip layout; the fixed width keeps the flip
    from resizing the chip. */
function CopyToastAction({
  short,
  autoCopied,
}: {
  short: string
  autoCopied: boolean
}) {
  const [copied, setCopied] = React.useState(autoCopied)
  React.useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  return (
    <button
      type="button"
      data-button
      onClick={() =>
        navigator.clipboard.writeText(short).then(
          () => setCopied(true),
          () => {}
        )
      }
      className="!w-16 !justify-center !bg-primary !text-primary-foreground whitespace-nowrap"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

/**
 * Auto-copy on create, then the toast; the chip's initial state says
 * whether the copy landed (Safari denies clipboard writes once the network
 * await has burned the user gesture, so the chip simply starts as "Copy"
 * there). The Promise.resolve hop matters: on plain-HTTP origins the
 * clipboard API is absent and writeText throws synchronously — without it
 * neither branch runs and the toast never fires.
 */
export function notifyLinkCreated(short: string) {
  // Machine text reads mono, same as every short link in the app.
  const description = (
    <span className="font-mono">
      {short.replace(/^https?:\/\//, "")}
      <ToastConfetti />
    </span>
  )
  const notify = (autoCopied: boolean) =>
    toast.success("Link created", {
      description,
      action: <CopyToastAction short={short} autoCopied={autoCopied} />,
    })
  Promise.resolve()
    .then(() => navigator.clipboard.writeText(short))
    .then(
      () => notify(true),
      () => notify(false)
    )
}
