"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type Props = {
  src?: string
  initials: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const dimensions = {
  sm: { box: "size-8", text: "text-[10px]", px: 32 },
  md: { box: "size-10", text: "text-xs", px: 40 },
  lg: { box: "size-14", text: "text-sm", px: 56 },
  xl: { box: "size-20", text: "text-base", px: 80 },
} as const

export function TestimonialAvatar({ src, initials, size = "md", className }: Props) {
  const [errored, setErrored] = React.useState(false)
  const d = dimensions[size]

  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={d.px}
        height={d.px}
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
        className={cn(
          "border-border/60 shrink-0 rounded-full border object-cover",
          d.box,
          className,
        )}
      />
    )
  }
  return (
    <div
      aria-hidden
      className={cn(
        "border-border/60 bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full border font-mono font-semibold",
        d.box,
        d.text,
        className,
      )}
    >
      {initials}
    </div>
  )
}
