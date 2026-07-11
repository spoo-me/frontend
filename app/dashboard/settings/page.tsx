"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowUpRight, BadgeCheck, ShieldCheck, UserRound } from "lucide-react"
import { toast } from "sonner"

import {
  listProfilePictures,
  oauthLinkHref,
  OAUTH_PROVIDERS,
  setProfilePicture,
  unlinkProvider,
  type AuthUser,
  type OAuthProviderName,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import { SESSION_KEY, useAuth } from "@/components/auth/auth-context"
import { UserAvatar } from "@/components/auth/user-menu"
import { BrandIcons } from "@/components/icons/brand-icons"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const PROVIDER_LABELS: Record<OAuthProviderName, string> = {
  google: "Google",
  github: "GitHub",
  discord: "Discord",
}

const PICTURES_KEY = ["profile-pictures"] as const

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

/**
 * The avatar with a chooser: providers each hand us a different picture, so
 * when candidates exist the avatar opens a popover to pick one. No
 * candidates (email-only account) means no chooser affordance at all.
 */
function AvatarRow({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: PICTURES_KEY,
    queryFn: listProfilePictures,
  })
  const pictures = data?.pictures ?? []

  const setPfp = useMutation({
    mutationFn: setProfilePicture,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
      void queryClient.invalidateQueries({ queryKey: PICTURES_KEY })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not update avatar"),
  })

  if (!pictures.length) return <UserAvatar user={user} className="size-8" />

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change avatar"
          className="group flex items-center gap-2.5"
        >
          <span className="text-muted-foreground group-hover:text-foreground text-xs underline underline-offset-4 transition-colors duration-150">
            change
          </span>
          <UserAvatar user={user} className="size-8" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <div className="flex items-center gap-3">
          {pictures.map((pic) => (
            <Tooltip key={pic.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setPfp.mutate(pic.id)}
                  disabled={setPfp.isPending}
                  className={cn(
                    "rounded-full transition-shadow duration-150",
                    pic.is_current
                      ? "ring-brand ring-offset-popover ring-2 ring-offset-2"
                      : "hover:ring-border hover:ring-offset-popover hover:ring-2 hover:ring-offset-2",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pic.url}
                    alt={`Picture from ${pic.source}`}
                    referrerPolicy="no-referrer"
                    className="size-9 rounded-full object-cover"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>from {pic.source}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * One row per LINKED provider — your sign-in methods are the rows that
 * exist, not a catalogue of what you could add. The guard against removing
 * the last method is a disabled affordance with the reason in a tooltip.
 */
function ProviderRow({ name, user }: { name: OAuthProviderName; user: AuthUser }) {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const linked = user.auth_providers?.find((p) => p.provider === name)
  const lastMethod =
    !!linked && !user.password_set && (user.auth_providers?.length ?? 0) <= 1
  const Brand = BrandIcons[name]

  const unlink = useMutation({
    mutationFn: () => unlinkProvider(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
      void queryClient.invalidateQueries({ queryKey: PICTURES_KEY })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not disconnect"),
  })

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-foreground flex items-center gap-2.5 text-sm">
        <Brand className="text-muted-foreground size-4" />
        {PROVIDER_LABELS[name]}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <span className="ph-no-capture text-muted-foreground hidden truncate font-mono text-xs sm:block">
          {linked?.email}
        </span>
        {linked?.linked_at && (
          <span className="text-muted-foreground/60 hidden font-mono text-[11px] whitespace-nowrap md:block">
            linked {formatDate(linked.linked_at)}
          </span>
        )}
        {lastMethod ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground/40 cursor-not-allowed text-xs">
                Disconnect
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Your only way to sign in. Set a password first.
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={unlink.isPending}
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4 transition-colors duration-150 disabled:opacity-50"
          >
            Disconnect
          </button>
        )}
      </span>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect {PROVIDER_LABELS[name]}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to sign in with{" "}
              {PROVIDER_LABELS[name]}. You can reconnect it any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => unlink.mutate()}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** Unlinked providers collapse into one quiet row of link-out affordances. */
function LinkProviderRow({ unlinked }: { unlinked: OAuthProviderName[] }) {
  return (
    <Row label="Link a provider">
      <span className="flex items-center gap-4">
        {unlinked.map((name) => {
          const Brand = BrandIcons[name]
          return (
            <a
              key={name}
              href={oauthLinkHref(name)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs underline underline-offset-4 transition-colors duration-150"
            >
              <Brand className="size-3.5" />
              {PROVIDER_LABELS[name]}
            </a>
          )
        })}
      </span>
    </Row>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  if (!user) return null

  const linked = OAUTH_PROVIDERS.filter((n) =>
    user.auth_providers?.some((p) => p.provider === n),
  )
  const unlinked = OAUTH_PROVIDERS.filter((n) => !linked.includes(n))

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
            <AvatarRow user={user} />
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
                set{!user.auth_providers?.length && " · your only sign-in method"}{" "}
                · change via{" "}
                <Link
                  href="/forgot-password"
                  className="text-foreground underline underline-offset-4"
                >
                  password reset
                </Link>
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                not set · you sign in with a provider
              </span>
            )}
          </Row>
          {linked.map((name) => (
            <ProviderRow key={name} name={name} user={user} />
          ))}
          {unlinked.length > 0 && <LinkProviderRow unlinked={unlinked} />}
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
