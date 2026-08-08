"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> }
}

/**
 * Theme switch wrapped in a View Transition — the browser cross-fades the
 * whole page between themes (duration tuned in globals.css). Falls back to an
 * instant switch when the API is unavailable or the user prefers reduced motion.
 */
function themeTransition(apply: () => void) {
  const doc = document as VTDocument
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (!doc.startViewTransition || reduce) {
    apply()
    return
  }
  doc.startViewTransition(() => {
    flushSync(apply)
  })
}

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      // Android IMEs and some virtual keyboards fire keydown with no
      // `key` at all.
      if (event.key?.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      themeTransition(() =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      )
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

export { ThemeProvider, themeTransition }
