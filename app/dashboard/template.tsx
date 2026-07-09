"use client"

import { motion } from "motion/react"

/**
 * Per-navigation entrance for dashboard pages: one quiet fade/rise, expo-out
 * (the taste budget's "one entrance moment"). Templates remount on route
 * change while the layout (sidebar/topbar/sheet) stays put.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
