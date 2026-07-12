"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-context"
import type { AuthUser } from "@/lib/api"

export function userInitials(user: AuthUser): string {
  const source = user.user_name?.trim() || user.email
  const parts = source.split(/[\s._@-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}

export function UserAvatar({
  user,
  className,
}: {
  user: AuthUser
  className?: string
}) {
  return user.pfp?.url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.pfp.url}
      alt=""
      referrerPolicy="no-referrer"
      className={cn("size-7 rounded-full object-cover", className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "flex size-7 items-center justify-center rounded-full bg-brand/15 font-semibold text-[11px] text-brand",
        className
      )}
    >
      {userInitials(user)}
    </span>
  )
}

/** Header session control — avatar dropdown when signed in. */
export function UserMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label="Account menu"
        >
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="ph-no-capture flex flex-col gap-0.5">
          <span className="truncate font-medium text-foreground text-sm">
            {user.user_name ?? user.email.split("@")[0]}
          </span>
          <span className="truncate font-normal text-muted-foreground text-xs">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void signOut().then(() => router.push("/"))
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
