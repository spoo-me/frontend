"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, BadgeCheck, ShieldCheck, UserRound } from "lucide-react"

import { useAuth } from "@/components/auth/auth-context"
import { UserAvatar } from "@/components/auth/user-menu"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { ThemeToggle } from "@/components/layout/theme-toggle"

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground flex min-w-0 items-center gap-2 text-sm">
        {children}
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <span className="label-mono text-muted-foreground/60">Settings</span>
      <h1 className="text-foreground mt-2 text-xl font-semibold tracking-tight">
        Account
      </h1>

      <div className="mt-6">
        <SectionHeader icon={UserRound} title="Profile" />
        <Panel className="divide-border/60 mt-2 divide-y">
          <Row label="Avatar">
            <UserAvatar user={user} className="size-8" />
          </Row>
          <Row label="Name">{user.user_name ?? <span className="text-muted-foreground">not set</span>}</Row>
          <Row label="Email">
            <span className="ph-no-capture truncate font-mono text-xs">{user.email}</span>
            {user.email_verified && (
              <span className="bg-live/10 text-live flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                <BadgeCheck className="size-3" />
                verified
              </span>
            )}
          </Row>
          <Row label="Plan">
            <span className="border-border/60 bg-muted/40 rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase">
              {user.plan ?? "free"}
            </span>
          </Row>
          <Row label="Theme">
            <ThemeToggle />
          </Row>
        </Panel>
      </div>

      <div className="mt-8">
        <SectionHeader icon={ShieldCheck} title="Security" />
        <Panel className="divide-border/60 mt-2 divide-y">
          <Row label="Password">
            {user.password_set ? (
              <span className="text-muted-foreground text-xs">
                set · change via{" "}
                <Link
                  href="/forgot-password"
                  className="text-foreground underline underline-offset-4"
                >
                  password reset
                </Link>
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                not set (OAuth account)
              </span>
            )}
          </Row>
          <Row label="Sign-in providers">
            {user.auth_providers?.length ? (
              <span className="flex items-center gap-1.5">
                {user.auth_providers.map((p) => {
                  const Brand = BrandIcons[p.provider as BrandIconKey]
                  return (
                    <span
                      key={p.provider}
                      className="border-border/60 bg-muted/40 flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px]"
                    >
                      {Brand && <Brand className="size-3" />}
                      {p.provider}
                    </span>
                  )
                })}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">email only</span>
            )}
          </Row>
          <Row label="Connected apps">
            <Link
              href="/dashboard/apps"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs underline underline-offset-4 transition-colors duration-150"
            >
              manage in Apps
              <ArrowUpRight className="size-3" />
            </Link>
          </Row>
        </Panel>
      </div>
    </div>
  )
}
