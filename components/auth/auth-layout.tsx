import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Logo } from "@/components/shared/logo"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative grid min-h-svh place-items-center px-4 py-10">
      {/* subtle radial backdrop */}
      <div
        aria-hidden
        className="bg-foreground/5 dark:bg-white/[0.04] absolute left-1/2 top-1/3 -z-10 h-72 w-[60rem] -translate-x-1/2 rounded-full blur-3xl"
      />
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground absolute left-6 top-6 inline-flex items-center gap-1.5 text-xs font-medium"
      >
        <ArrowLeft className="size-3" />
        Back home
      </Link>
      <div className="absolute right-6 top-6">
        <Logo withText={false} />
      </div>
      {children}
    </div>
  )
}
