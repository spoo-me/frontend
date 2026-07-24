"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpRight,
  BadgeCheck,
  Plus,
  ShieldCheck,
  UserRound,
} from "@/components/icons"
import { toast } from "sonner"

import {
  listProfilePictures,
  oauthLinkHref,
  OAUTH_PROVIDERS,
  PROFILE_PICTURE_MAX_BYTES,
  removeProfilePicture,
  setProfilePicture,
  unlinkProvider,
  updateProfile,
  uploadProfilePicture,
  type AuthUser,
  type OAuthProviderName,
} from "@/lib/api"
import { PRICING_ENABLED } from "@/lib/flags"
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
      <span className="flex min-w-0 items-center gap-2 text-foreground text-sm">
        {children}
      </span>
    </div>
  )
}

/** Client mirror of the server's display-name bounds (1..255 after trim). */
const NAME_MAX = 255

/**
 * The name with an inline editor: the value doubles as the edit affordance
 * (same shape as the avatar's "change"). Enter or blur saves, Escape
 * cancels; an empty submit clears the name back to "not set" — the same
 * normalization the backend applies.
 */
function NameRow({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const save = useMutation({
    mutationFn: (name: string | null) => updateProfile({ user_name: name }),
    onSuccess: ({ user: updated }) => {
      // Same shape as GET /auth/me — write it straight into the session
      // cache so the sidebar, header menu, and greeting update together.
      queryClient.setQueryData(SESSION_KEY, updated)
      setEditing(false)
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not update name"),
  })

  // Escape unmounts the focused input, and some browser/React combinations
  // deliver that as a native blur into onBlur, which would save the draft
  // instead of discarding it.
  const escaped = React.useRef(false)

  const open = () => {
    setDraft(user.user_name ?? "")
    setError(null)
    escaped.current = false
    setEditing(true)
  }

  const submit = () => {
    if (escaped.current || save.isPending) return
    const trimmed = draft.trim()
    if (trimmed.length > NAME_MAX) {
      setError(`keep it under ${NAME_MAX} characters`)
      return
    }
    if (trimmed === (user.user_name ?? "")) {
      setEditing(false)
      return
    }
    save.mutate(trimmed || null)
  }

  if (!editing)
    return (
      <button
        type="button"
        onClick={open}
        className="group flex items-center gap-2.5"
      >
        <span className="text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 group-hover:text-foreground">
          edit
        </span>
        {user.user_name ?? (
          <span className="text-muted-foreground">not set</span>
        )}
      </button>
    )

  return (
    <span className="flex items-center gap-2.5">
      {error && (
        <span className="font-mono text-[11px] text-destructive">{error}</span>
      )}
      <input
        autoFocus
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit()
          if (e.key === "Escape") {
            escaped.current = true
            setEditing(false)
          }
        }}
        onBlur={submit}
        disabled={save.isPending}
        placeholder="Your name"
        aria-label="Display name"
        className="h-7 w-44 rounded-md border border-border/60 bg-transparent px-2 text-foreground text-sm outline-none focus:border-border disabled:opacity-50"
      />
    </span>
  )
}

/**
 * The avatar with a chooser: provider pictures to pick from, an upload
 * tile, and — only while a picture is set — a remove affordance that goes
 * back to the initials avatar.
 */
function AvatarRow({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient()
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const { data } = useQuery({
    queryKey: PICTURES_KEY,
    queryFn: listProfilePictures,
  })
  const pictures = data?.pictures ?? []

  const refreshAvatar = () => {
    void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
    void queryClient.invalidateQueries({ queryKey: PICTURES_KEY })
  }

  const setPfp = useMutation({
    mutationFn: setProfilePicture,
    onSuccess: refreshAvatar,
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not update avatar"),
  })

  const upload = useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: () => {
      setUploadError(null)
      refreshAvatar()
    },
    onError: (e) =>
      setUploadError(
        e instanceof Error ? e.message : "Could not upload the image"
      ),
  })

  const remove = useMutation({
    mutationFn: removeProfilePicture,
    onSuccess: refreshAvatar,
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not remove picture"),
  })

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // the same file can be re-picked after a rejection
    if (!file) return
    setUploadError(null)
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("png, jpeg or webp only")
      return
    }
    // Mirror the server's decoded-size cap before shipping the base64.
    if (file.size > PROFILE_PICTURE_MAX_BYTES) {
      setUploadError(`image is over ${PROFILE_PICTURE_MAX_BYTES / 1000} KB`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => upload.mutate(String(reader.result))
    reader.onerror = () => setUploadError("couldn't read that file")
    reader.readAsDataURL(file)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change avatar"
          className="group flex items-center gap-2.5"
        >
          <span className="text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 group-hover:text-foreground">
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
                      ? "ring-2 ring-brand ring-offset-2 ring-offset-popover"
                      : "hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-popover"
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
          {user.pfp?.source === "upload" && user.pfp.url && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="rounded-full ring-2 ring-brand ring-offset-2 ring-offset-popover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.pfp.url}
                    alt="Your uploaded picture"
                    className="size-9 rounded-full object-cover"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>your upload</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Upload a picture"
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
                className="flex size-9 items-center justify-center rounded-full border border-border border-dashed text-muted-foreground transition-colors duration-150 hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
              >
                <Plus className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>upload an image, up to 512 KB</TooltipContent>
          </Tooltip>
        </div>
        {uploadError && (
          <p className="mt-2 font-mono text-[11px] text-destructive">
            {uploadError}
          </p>
        )}
        {user.pfp?.url && (
          <button
            type="button"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="mt-2.5 text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 hover:text-foreground disabled:opacity-50"
          >
            remove picture
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFile}
          className="hidden"
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * One row per LINKED provider — your sign-in methods are the rows that
 * exist, not a catalogue of what you could add. The guard against removing
 * the last method is a disabled affordance with the reason in a tooltip.
 */
function ProviderRow({
  name,
  user,
}: {
  name: OAuthProviderName
  user: AuthUser
}) {
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
      <span className="flex items-center gap-2.5 text-foreground text-sm">
        <Brand className="size-4 text-muted-foreground" />
        {PROVIDER_LABELS[name]}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <span className="ph-no-capture hidden truncate font-mono text-muted-foreground text-xs sm:block">
          {linked?.email}
        </span>
        {linked?.linked_at && (
          <span className="hidden whitespace-nowrap font-mono text-[11px] text-muted-foreground/60 md:block">
            linked {formatDate(linked.linked_at)}
          </span>
        )}
        {lastMethod ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-not-allowed text-muted-foreground/40 text-xs">
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
            className="text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 hover:text-foreground disabled:opacity-50"
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
              You will no longer be able to sign in with {PROVIDER_LABELS[name]}
              . You can reconnect it any time.
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
              className="flex items-center gap-1.5 text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
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
    user.auth_providers?.some((p) => p.provider === n)
  )
  const unlinked = OAUTH_PROVIDERS.filter((n) => !linked.includes(n))

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <span className="label-mono text-muted-foreground/60">Settings</span>
      <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
        Account
      </h1>

      <div className="mt-6">
        <SectionHeader icon={UserRound} title="Profile" />
        <Panel className="mt-2 divide-y divide-border/60">
          <Row label="Avatar">
            <AvatarRow user={user} />
          </Row>
          <Row label="Name">
            <NameRow user={user} />
          </Row>
          <Row label="Email">
            <span className="ph-no-capture truncate font-mono text-xs">
              {user.email}
            </span>
            {user.email_verified && (
              <span className="flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 font-medium text-[10px] text-live">
                <BadgeCheck className="size-3" />
                verified
              </span>
            )}
          </Row>
          {PRICING_ENABLED && (
            <Row label="Plan">
              <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[11px] uppercase">
                {user.plan ?? "free"}
              </span>
            </Row>
          )}
          <Row label="Theme">
            <ThemeToggle />
          </Row>
        </Panel>
      </div>

      <div className="mt-8">
        <SectionHeader icon={ShieldCheck} title="Security" />
        <Panel className="mt-2 divide-y divide-border/60">
          <Row label="Password">
            {user.password_set ? (
              <span className="text-muted-foreground text-xs">
                set
                {!user.auth_providers?.length && " · your only sign-in method"}{" "}
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
              className="flex items-center gap-1 text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
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
