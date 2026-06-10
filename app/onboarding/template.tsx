"use client"

import { motion } from "motion/react"

/** Per-navigation entrance — the same choreography the wizard had. */
export default function OnboardingTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="flex w-full max-w-2xl justify-center"
    >
      {children}
    </motion.div>
  )
}
