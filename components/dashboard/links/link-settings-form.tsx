"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronDown,
  CircleAlert,
  Dices,
  KeyRound,
  LoaderCircle,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  checkAlias,
  updateUrl,
  SpooApiError,
  type UpdateUrlInput,
  type UrlListItem,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * The ONE link-settings component — rendered by both the quick sheet and the
 * detail page (SPEC round 3: one form, two containers, no drift).
 *
 * Removal semantics (SPEC §5): password is hashed server-side and never
 * shown; removing password / expiry / max-clicks are explicit verbs that
 * PATCH null — not empty inputs.
 */

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const WORDS =
  "amber basil cedar delta ember fable garnet hazel indigo juniper koala lumen maple nectar onyx pixel quartz raven sable tundra umber velvet willow zephyr".split(
    " ",
  )
function suggestPassword() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)]
  return `${pick()}-${pick()}-${Math.floor(10 + Math.random() * 89)}`
}

function normalizeUrl(raw: string) {
  const v = raw.trim()
  return /^https?:\/\//i.test(v) || v === "" ? v : `https://${v}`
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-foreground text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground/70 text-xs">{hint}</p>}
    </div>
  )
}

export function LinkSettingsForm({
  link,
  domains = ["spoo.me"],
  onSaved,
}: {
  link: UrlListItem
  domains?: string[]
  onSaved?: (next: UrlListItem) => void
}) {
  const queryClient = useQueryClient()

  const [longUrl, setLongUrl] = React.useState(link.long_url ?? "")
  const [alias, setAlias] = React.useState(link.alias ?? "")
  const [domain, setDomain] = React.useState(link.domain ?? "spoo.me")

  // Password tri-state: keep (untouched) | set new value | remove.
  const [passwordMode, setPasswordMode] = React.useState<"keep" | "set" | "remove">(
    "keep",
  )
  const [newPassword, setNewPassword] = React.useState("")

  const [expiry, setExpiry] = React.useState(
    link.expire_after ? toLocalInputValue(new Date(link.expire_after * 1000)) : "",
  )
  const [maxClicks, setMaxClicks] = React.useState(
    link.max_clicks != null ? String(link.max_clicks) : "",
  )
  const [blockBots, setBlockBots] = React.useState(Boolean(link.block_bots))
  const [privateStats, setPrivateStats] = React.useState(Boolean(link.private_stats))

  const aliasChanged = alias !== (link.alias ?? "")
  const [aliasState, setAliasState] = React.useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle")
  React.useEffect(() => {
    if (!aliasChanged || !alias) return setAliasState("idle")
    if (!/^[a-zA-Z0-9_-]{3,16}$/.test(alias)) return setAliasState("invalid")
    setAliasState("checking")
    const t = setTimeout(() => {
      checkAlias(alias)
        .then((r) => setAliasState(r.available ? "available" : "taken"))
        .catch(() => setAliasState("idle"))
    }, 350)
    return () => clearTimeout(t)
  }, [alias, aliasChanged])

  const patch: UpdateUrlInput = {}
  if (normalizeUrl(longUrl) !== (link.long_url ?? "")) patch.long_url = normalizeUrl(longUrl)
  if (aliasChanged && alias) patch.alias = alias
  if ((domain === "spoo.me" ? null : domain) !== link.domain)
    patch.domain = domain === "spoo.me" ? null : domain
  if (passwordMode === "set" && newPassword) patch.password = newPassword
  if (passwordMode === "remove") patch.password = null
  const expiryUnix = expiry ? Math.floor(new Date(expiry).getTime() / 1000) : null
  if (expiryUnix !== (link.expire_after ?? null)) patch.expire_after = expiryUnix
  const maxClicksVal = maxClicks === "" ? null : Number(maxClicks)
  if (maxClicksVal !== (link.max_clicks ?? null)) patch.max_clicks = maxClicksVal
  if (blockBots !== Boolean(link.block_bots)) patch.block_bots = blockBots
  if (privateStats !== Boolean(link.private_stats)) patch.private_stats = privateStats

  const dirty = Object.keys(patch).length > 0

  const save = useMutation({
    mutationFn: () => updateUrl(link.id, patch),
    onSuccess: (next) => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      setPasswordMode("keep")
      setNewPassword("")
      toast.success("Link updated")
      onSaved?.(next)
    },
    onError: (err) => {
      if (err instanceof SpooApiError && err.field === "alias") setAliasState("taken")
      toast.error(err instanceof Error ? err.message : "Couldn't save changes")
    },
  })

  const canSave =
    dirty &&
    !save.isPending &&
    (!aliasChanged || aliasState === "available" || alias === "") &&
    (passwordMode !== "set" || newPassword.length > 0)

  return (
    <div className="space-y-5">
      <Field label="Destination">
        <Input
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          spellCheck={false}
          className="h-9 font-mono text-xs"
        />
      </Field>

      <Field
        label="Short link"
        hint={
          aliasState === "taken"
            ? "That alias is taken."
            : aliasState === "invalid"
              ? "3–16 characters: letters, numbers, - and _"
              : "Changing the alias breaks the old address."
        }
      >
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border/60 bg-muted/40 text-foreground hover:bg-accent/60 flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2.5 font-mono text-xs transition-colors duration-150"
              >
                {domain}
                <ChevronDown className="text-muted-foreground size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {domains.map((d) => (
                <DropdownMenuItem key={d} onSelect={() => setDomain(d)}>
                  <span className="font-mono text-xs">{d}</span>
                  {d === domain && <Check className="ml-auto size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-muted-foreground font-mono text-xs">/</span>
          <div className="relative flex-1">
            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              spellCheck={false}
              className="h-9 pr-8 font-mono text-xs"
            />
            <span className="absolute top-1/2 right-2.5 -translate-y-1/2">
              {aliasState === "checking" && (
                <LoaderCircle className="text-muted-foreground size-3.5 animate-spin" />
              )}
              {aliasState === "available" && <Check className="text-live size-3.5" />}
              {(aliasState === "taken" || aliasState === "invalid") && (
                <CircleAlert className="text-destructive size-3.5" />
              )}
            </span>
          </div>
        </div>
      </Field>

      <Field label="Password">
        {link.password_set && passwordMode === "keep" ? (
          <div className="border-border/60 bg-muted/30 flex h-9 items-center gap-2 rounded-lg border px-3">
            <KeyRound className="text-muted-foreground size-3.5" strokeWidth={1.75} />
            <span className="text-muted-foreground flex-1 text-xs">
              Password is set. It can be replaced or removed, not viewed.
            </span>
            <button
              type="button"
              onClick={() => setPasswordMode("set")}
              className="text-foreground text-xs underline underline-offset-4"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => setPasswordMode("remove")}
              className="text-destructive text-xs underline underline-offset-4"
            >
              Remove
            </button>
          </div>
        ) : passwordMode === "remove" ? (
          <div className="border-destructive/30 bg-destructive/5 flex h-9 items-center gap-2 rounded-lg border px-3">
            <span className="text-destructive flex-1 text-xs">
              Password will be removed on save.
            </span>
            <button
              type="button"
              onClick={() => setPasswordMode("keep")}
              className="text-foreground text-xs underline underline-offset-4"
            >
              Undo
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={
                link.password_set ? "New password" : "Add a password (optional)"
              }
              spellCheck={false}
              autoComplete="off"
              className="h-9 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={() => {
                setPasswordMode("set")
                setNewPassword(suggestPassword())
              }}
            >
              <Dices data-icon="inline-start" />
              Suggest
            </Button>
            {(newPassword || link.password_set) && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Cancel password change"
                onClick={() => {
                  setPasswordMode("keep")
                  setNewPassword("")
                }}
              >
                <X />
              </Button>
            )}
          </div>
        )}
        {passwordMode !== "remove" && !link.password_set && null}
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Expires">
          <div className="flex items-center gap-1.5">
            <Input
              type="datetime-local"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="h-9 font-mono text-xs"
            />
            {expiry && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove expiry"
                onClick={() => setExpiry("")}
              >
                <X />
              </Button>
            )}
          </div>
        </Field>
        <Field label="Max clicks">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
              placeholder="Unlimited"
              className="h-9 font-mono text-xs"
            />
            {maxClicks && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove click limit"
                onClick={() => setMaxClicks("")}
              >
                <X />
              </Button>
            )}
          </div>
        </Field>
      </div>

      <div className="border-border/60 divide-border/60 divide-y rounded-xl border">
        <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
          <span>
            <span className="text-foreground block text-xs font-medium">Block bots</span>
            <span className="text-muted-foreground/70 text-xs">
              Crawlers get a preview page instead of the redirect.
            </span>
          </span>
          <Switch checked={blockBots} onCheckedChange={setBlockBots} />
        </label>
        <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
          <span>
            <span className="text-foreground block text-xs font-medium">
              Private stats
            </span>
            <span className="text-muted-foreground/70 text-xs">
              Only you can see this link&apos;s analytics.
            </span>
          </span>
          <Switch checked={privateStats} onCheckedChange={setPrivateStats} />
        </label>
      </div>

      <div
        className={cn(
          "flex items-center justify-end gap-2 transition-opacity duration-150",
          dirty ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <span className="text-muted-foreground/70 mr-auto text-xs">
          {save.isPending ? "Saving…" : "Unsaved changes"}
        </span>
        <Button size="sm" disabled={!canSave} onClick={() => save.mutate()}>
          Save changes
        </Button>
      </div>
    </div>
  )
}
