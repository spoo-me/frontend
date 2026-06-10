"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { useOnboarding } from "@/components/onboarding/use-onboarding"

/** The brand beat — one breath between signup and setup. */
export default function WelcomePage() {
  const { advance } = useOnboarding()

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        advance("path")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [advance])

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative"
      >
        {/* The logo sits in its own aurora — the only loud moment in the flow */}
        <div
          aria-hidden
          className="bg-brand/25 absolute -inset-10 rounded-full blur-3xl"
        />
        <Logo
          withText={false}
          href={null}
          className="relative size-20 drop-shadow-[0_8px_30px_rgba(139,92,246,0.35)] [&_img]:size-20"
        />
      </motion.div>

      <h1 className="text-foreground mt-10 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Welcome to spoo.me
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        Short links, QR codes, and real-time analytics — with an API
        underneath everything. Let&apos;s get you set up.
      </p>

      <Button onClick={() => advance("path")} className="mt-10 h-10 min-w-48">
        Get started
        <ArrowRight className="size-4" data-icon="inline-end" />
      </Button>
    </div>
  )
}
