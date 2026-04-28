"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  withText?: boolean
  href?: string | null
}

export function Logo({ className, withText = true, href = "/" }: LogoProps) {
  const content = withText ? <Wordmark className={className} /> : <LogoMark className={className} />

  if (!href) return content
  return (
    <Link href={href} className="inline-flex items-center" aria-label="spoo.me">
      {content}
    </Link>
  )
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex h-7 items-center", className)}>
      <Image
        src="/brand/logo-text-light.png"
        alt=""
        width={400}
        height={120}
        className="block h-7 w-auto object-contain dark:hidden"
        priority
      />
      <Image
        src="/brand/logo-text-dark.png"
        alt=""
        width={400}
        height={120}
        className="hidden h-7 w-auto object-contain dark:block"
        priority
      />
    </span>
  )
}

function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-7 items-center justify-center", className)}>
      <Image
        src="/brand/logo-black.png"
        alt=""
        width={28}
        height={28}
        className="size-7 object-contain dark:hidden"
        priority
      />
      <Image
        src="/favicon.png"
        alt=""
        width={28}
        height={28}
        className="hidden size-7 object-contain dark:block"
        priority
      />
    </span>
  )
}
