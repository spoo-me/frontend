"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpRight,
  BadgeCheck,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteAccount,
  listProfilePictures,
  oauthLinkHref,
  OAUTH_PROVIDERS,
  PROFILE_PICTURE_MAX_BYTES,
  removeProfilePicture,
  setProfilePicture,
  SpooApiError,
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
import { UserAvatar, userInitials } from "@/components/auth/user-menu"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  description,
  children,
}: {
  label: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 font-medium text-foreground text-sm">
          {label}
        </div>
        {description && (
          <div className="mt-1 truncate text-[13px] text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  )
}

/**
 * Settings grammar: the section's name and one dry sentence sit in a left
 * rail, the rows in a panel on the right — the rail is what keeps a wide
 * page from reading as a floating strip of rows.
 */
function Section({
  icon,
  title,
  description,
  children,
}: {
  /** Danger zone only — the warning glyph earns its place, the rest don't. */
  icon?: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-4 py-10 first:pt-0 last:pb-0 lg:grid-cols-[200px_1fr] lg:gap-12">
      <div>
        <SectionHeader icon={icon} title={title} className="h-auto" />
        <p className="mt-2 text-[13px] text-muted-foreground/80 leading-relaxed">
          {description}
        </p>
      </div>
      <Panel className="h-fit divide-y divide-border/60">{children}</Panel>
    </section>
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
      <>
        <span className="text-foreground text-sm">
          {user.user_name ?? (
            <span className="text-muted-foreground">not set</span>
          )}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Edit name"
              onClick={open}
            >
              <Pencil />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit name</TooltipContent>
        </Tooltip>
      </>
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
        className="h-8 w-52 rounded-lg border border-border/60 bg-transparent px-2.5 text-foreground text-sm outline-none focus:border-ring disabled:opacity-50"
      />
    </span>
  )
}

/** One option in the avatar chooser: a circle with its source named under it. */
function AvatarChoice({
  label,
  current,
  onSelect,
  disabled,
  children,
}: {
  label: string
  current: boolean
  onSelect: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="group flex w-16 flex-col items-center gap-2 disabled:opacity-50"
    >
      <span
        className={cn(
          "rounded-full transition-shadow duration-150",
          current
            ? "ring-2 ring-brand ring-offset-2 ring-offset-popover"
            : "group-hover:ring-2 group-hover:ring-border group-hover:ring-offset-2 group-hover:ring-offset-popover"
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          "font-mono text-[10px] transition-colors duration-150",
          current
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {label}
      </span>
    </button>
  )
}

/**
 * The avatar with a chooser: every state is an equal, named tile —
 * provider pictures, your upload, and the initials fallback — so going
 * back to initials is a choice, not a separate "remove" affordance.
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
          className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <UserAvatar user={user} className="size-10" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-aria-expanded:opacity-100">
            <Pencil className="size-4 text-white" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-4">
        <div className="flex items-start gap-2">
          {pictures.map((pic) => (
            <AvatarChoice
              key={pic.id}
              label={pic.source}
              current={pic.is_current}
              onSelect={() => {
                if (!pic.is_current) setPfp.mutate(pic.id)
              }}
              disabled={setPfp.isPending}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pic.url}
                alt={`Picture from ${pic.source}`}
                referrerPolicy="no-referrer"
                className="size-11 rounded-full object-cover"
              />
            </AvatarChoice>
          ))}
          <AvatarChoice
            label="upload"
            current={user.pfp?.source === "upload" && !!user.pfp.url}
            onSelect={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            {user.pfp?.source === "upload" && user.pfp.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.pfp.url}
                alt="Your uploaded picture"
                className="size-11 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-full border border-border border-dashed text-muted-foreground transition-colors duration-150 group-hover:border-foreground/40 group-hover:text-foreground">
                <Plus className="size-4" />
              </span>
            )}
          </AvatarChoice>
          <AvatarChoice
            label="initials"
            current={!user.pfp?.url}
            onSelect={() => {
              if (user.pfp?.url) remove.mutate()
            }}
            disabled={remove.isPending}
          >
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-full bg-brand/15 font-semibold text-[15px] text-brand"
            >
              {userInitials(user)}
            </span>
          </AvatarChoice>
        </div>
        <p
          className={cn(
            "mt-3 font-mono text-[10px]",
            uploadError ? "text-destructive" : "text-muted-foreground/70"
          )}
        >
          {uploadError ?? "png, jpeg or webp · up to 512 KB"}
        </p>
        <input
          ref={fileRef}
          aria-label="Profile picture file"
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
    <Row
      label={
        <>
          <Brand className="size-4 text-muted-foreground" />
          {PROVIDER_LABELS[name]}
        </>
      }
      description={
        <span className="font-mono text-xs">
          <span className="ph-no-capture">{linked?.email}</span>
          {linked?.linked_at && (
            <span className="text-muted-foreground/60">
              {" · "}linked {formatDate(linked.linked_at)}
            </span>
          )}
        </span>
      }
    >
      {lastMethod ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed">
              <Button variant="outline" size="sm" disabled>
                Disconnect
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Your only way to sign in. Set a password first.
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={unlink.isPending}
        >
          Disconnect
        </Button>
      )}

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
    </Row>
  )
}

/** Unlinked providers collapse into one quiet row of link-out affordances. */
function LinkProviderRow({ unlinked }: { unlinked: OAuthProviderName[] }) {
  return (
    <Row label="Link a provider" description="Add another way to sign in.">
      {unlinked.map((name) => {
        const Brand = BrandIcons[name]
        return (
          <Button key={name} variant="outline" size="sm" asChild>
            <a href={oauthLinkHref(name)}>
              <Brand className="size-3.5" />
              {PROVIDER_LABELS[name]}
            </a>
          </Button>
        )
      })}
    </Row>
  )
}

/**
 * Deletion with the grace-period contract made visible: one proof input
 * (password, or the typed email for provider-only accounts), then the
 * dialog flips to the scheduled state carrying the purge date and the
 * cancel-link pointer. The account is signed out from there.
 */
function DeleteAccountRow({ user }: { user: AuthUser }) {
  const router = useRouter()
  const { signOut } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [proof, setProof] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [purgeAfter, setPurgeAfter] = React.useState<string | null>(null)

  const request = useMutation({
    mutationFn: () =>
      deleteAccount(
        user.password_set
          ? { password: proof }
          : { confirm_email: proof.trim() }
      ),
    onSuccess: ({ purge_after }) => setPurgeAfter(purge_after),
    onError: (e) => {
      if (e instanceof SpooApiError && e.status === 403)
        setError(
          user.password_set ? "wrong password" : "that email doesn't match"
        )
      else if (e instanceof SpooApiError && e.status === 409)
        setError("deletion is already scheduled")
      else setError(e instanceof Error ? e.message : "something went wrong")
    },
  })

  const canConfirm = user.password_set
    ? proof.length > 0
    : proof.trim() === user.email

  const reset = (next: boolean) => {
    // The scheduled state is a point of no return in this pane: leaving the
    // dialog then means leaving the session too.
    if (!next && purgeAfter) {
      void signOut().then(() => router.push("/"))
      return
    }
    setOpen(next)
    if (!next) {
      setProof("")
      setError(null)
    }
  }

  return (
    <Row
      label="Delete account"
      description="Erases your links, analytics and profile after a 7 day grace period."
    >
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Delete account
      </Button>

      <AlertDialog open={open} onOpenChange={reset}>
        <AlertDialogContent>
          {purgeAfter ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletion scheduled</AlertDialogTitle>
                <AlertDialogDescription>
                  Your account and everything in it will be erased on{" "}
                  <span className="font-mono text-foreground">
                    {formatDate(purgeAfter)}
                  </span>
                  . We sent a cancel link to{" "}
                  <span className="ph-no-capture font-mono text-foreground">
                    {user.email}
                  </span>
                  ; it restores the account any time before then.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => void signOut().then(() => router.push("/"))}
                >
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your links, click analytics, API keys and connected apps are
                  erased for good. Deletion runs after a 7 day grace period;
                  signing in is blocked while it waits, and the email we send
                  you contains a link that cancels it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="delete-proof"
                  className="font-medium text-foreground text-sm"
                >
                  {user.password_set ? (
                    "Confirm with your password"
                  ) : (
                    <>
                      Type{" "}
                      <span className="ph-no-capture font-mono text-[13px]">
                        {user.email}
                      </span>{" "}
                      to confirm
                    </>
                  )}
                </label>
                <Input
                  id="delete-proof"
                  type={user.password_set ? "password" : "email"}
                  value={proof}
                  onChange={(e) => {
                    setProof(e.target.value)
                    setError(null)
                  }}
                  autoComplete={user.password_set ? "current-password" : "off"}
                  className={cn(!user.password_set && "font-mono text-[13px]")}
                  aria-invalid={!!error || undefined}
                />
                {error && (
                  <span className="font-mono text-[11px] text-destructive">
                    {error}
                  </span>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={!canConfirm || request.isPending}
                  onClick={(e) => {
                    e.preventDefault()
                    request.mutate()
                  }}
                >
                  {request.isPending ? "Scheduling…" : "Delete account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
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
    <div className="mx-auto w-full max-w-4xl pb-12">
      <span className="label-mono text-muted-foreground/60">Settings</span>
      <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
        Account
      </h1>

      <div className="mt-10 divide-y divide-border/50">
        <Section
          title="Profile"
          description="How your account appears."
        >
          <Row
            label="Avatar"
            description="A provider picture, or upload your own."
          >
            <AvatarRow user={user} />
          </Row>
          <Row label="Name" description="How the dashboard addresses you.">
            <NameRow user={user} />
          </Row>
          <Row label="Email" description="Where account mail is sent.">
            <span className="ph-no-capture truncate font-mono text-[13px]">
              {user.email}
            </span>
            {user.email_verified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <BadgeCheck
                    aria-label="Email verified"
                    className="size-3.5 text-live"
                  />
                </TooltipTrigger>
                <TooltipContent>verified</TooltipContent>
              </Tooltip>
            )}
          </Row>
          {PRICING_ENABLED && (
            <Row label="Plan" description="What this account is on.">
              <span className="font-mono text-[11px] text-muted-foreground uppercase">
                {user.plan ?? "free"}
              </span>
            </Row>
          )}
        </Section>

        <Section
          title="Preferences"
          description="Defaults for this browser."
        >
          <Row label="Theme" description="System follows your OS setting.">
            <ThemeToggle />
          </Row>
        </Section>

        <Section
          title="Security"
          description="Ways to sign in, and what has access."
        >
          <Row
            label="Password"
            description={
              user.password_set
                ? user.auth_providers?.length
                  ? "Set."
                  : "Set. Your only sign-in method."
                : "Not set. You sign in with a provider."
            }
          >
            {user.password_set && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/forgot-password">Change password</Link>
              </Button>
            )}
          </Row>
          {linked.map((name) => (
            <ProviderRow key={name} name={name} user={user} />
          ))}
          {unlinked.length > 0 && <LinkProviderRow unlinked={unlinked} />}
          <Row
            label="Connected apps"
            description="Third-party apps authorized on your account."
          >
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/apps">
                Manage in Apps
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </Row>
        </Section>

        <Section
          icon={TriangleAlert}
          title="Danger zone"
          description="Remove the account and everything in it."
        >
          <DeleteAccountRow user={user} />
        </Section>
      </div>
    </div>
  )
}
