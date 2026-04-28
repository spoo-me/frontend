"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "motion/react"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { BrandIcons } from "@/components/icons/brand-icons"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { navLinks, siteConfig } from "@/lib/site-config"

export function Header() {
  const [open, setOpen] = React.useState(false)
  const { scrollY } = useScroll()
  const blur = useTransform(scrollY, [0, 80], [0, 14])
  const bg = useTransform(scrollY, [0, 80], [0, 0.7])

  return (
    <motion.header
      style={{
        backdropFilter: useTransform(blur, (v) => `blur(${v}px)`),
        WebkitBackdropFilter: useTransform(blur, (v) => `blur(${v}px)`),
      }}
      className="border-border/40 fixed inset-x-0 top-0 z-50 border-b border-transparent transition-colors"
    >
      <motion.div
        style={{ opacity: bg }}
        className="bg-background/70 absolute inset-0 -z-10"
      />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={"external" in link && link.external ? "_blank" : undefined}
                rel={"external" in link && link.external ? "noreferrer" : undefined}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon-sm" aria-label="GitHub">
            <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
              <BrandIcons.github className="size-3.5" />
            </a>
          </Button>
          <span className="bg-border/70 mx-1 hidden h-4 w-px md:inline-block" />
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-3.5" /> : <Menu className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("bg-background/95 overflow-hidden border-t md:hidden", !open && "border-transparent")}
      >
        <div className="space-y-1 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={"external" in link && link.external ? "_blank" : undefined}
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted block rounded-md px-3 py-2 text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="flex-1">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.header>
  )
}
