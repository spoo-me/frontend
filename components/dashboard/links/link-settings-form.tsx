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
import { Input } from "@/components/ui/input"
import { DateTimeField } from "@/components/dashboard/date-time-field"
import { PasswordInput } from "@/components/dashboard/password-input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  completeGeoRules,
  completeVariants,
  GeoRulesEditor,
  metaDraftOf,
  MetaTagsEditor,
  metaTagsOf,
  VariantsEditor,
  variantTotal,
  type GeoRuleDraft,
  type MetaDraft,
  type VariantDraft,
} from "@/components/dashboard/links/link-feature-editors"

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
function suggestAlias() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)]
  return `${pick()}-${Math.floor(10 + Math.random() * 89)}`
}

function normalizeUrl(raw: string) {
  const v = raw.trim()
  return /^https?:\/\//i.test(v) || v === "" ? v : `https://${v}`
}

/**
 * Truncate a from/to pair so the point where they diverge stays visible —
 * plain end-truncation would render two long URLs as the same prefix.
 */
function diffTruncate(from: string, to: string, max = 16): [string, string] {
  if (from.length <= max && to.length <= max) return [from, to]
  let p = 0
  while (p < from.length && p < to.length && from[p] === to[p]) p++
  const start = Math.max(0, Math.min(p - 4, Math.max(from.length, to.length) - max))
  const cut = (s: string) => {
    let out = s.slice(start)
    if (out.length > max) out = `${out.slice(0, max - 1)}…`
    return start > 0 ? `…${out}` : out
  }
  return [cut(from), cut(to)]
}

function formatWhen(unix: number) {
  return new Date(unix * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

type ChangeRow = { field: string; from: string; to: string }

/** Audit rows for the confirm dialog — only what changed, values summarized. */
function describeChanges(link: UrlListItem, patch: UpdateUrlInput): ChangeRow[] {
  const rows: ChangeRow[] = []
  const strip = (u: string) => u.replace(/^https?:\/\//, "")
  if (patch.long_url !== undefined) {
    const [from, to] = diffTruncate(
      strip(link.long_url ?? ""),
      strip(patch.long_url),
    )
    rows.push({ field: "Destination", from, to })
  }
  if (patch.alias !== undefined)
    rows.push({ field: "Short link", from: `/${link.alias}`, to: `/${patch.alias}` })
  if (patch.domain !== undefined)
    rows.push({
      field: "Domain",
      from: link.domain ?? "spoo.me",
      to: patch.domain ?? "spoo.me",
    })
  if (patch.password !== undefined)
    rows.push({
      field: "Password",
      from: link.password_set ? "••••••" : "none",
      to:
        patch.password === null
          ? "none"
          : link.password_set
            ? "replaced"
            : "••••••",
    })
  if (patch.expire_after !== undefined)
    rows.push({
      field: "Expires",
      from: link.expire_after ? formatWhen(link.expire_after) : "never",
      to: patch.expire_after ? formatWhen(patch.expire_after) : "never",
    })
  if (patch.max_clicks !== undefined)
    rows.push({
      field: "Max clicks",
      from: link.max_clicks != null ? String(link.max_clicks) : "unlimited",
      to: patch.max_clicks != null ? String(patch.max_clicks) : "unlimited",
    })
  if (patch.block_bots !== undefined)
    rows.push({
      field: "Block bots",
      from: link.block_bots ? "on" : "off",
      to: patch.block_bots ? "on" : "off",
    })
  if (patch.private_stats !== undefined)
    rows.push({
      field: "Private stats",
      from: link.private_stats ? "on" : "off",
      to: patch.private_stats ? "on" : "off",
    })
  const countOf = (n: number | undefined, noun: string) =>
    !n ? "off" : `${n} ${noun}${n === 1 ? "" : "s"}`
  if (patch.geo_rules !== undefined)
    rows.push({
      field: "Geo rules",
      from: countOf(link.geo_rules?.length, "rule"),
      to: countOf(patch.geo_rules?.length, "rule"),
    })
  if (patch.ab_variants !== undefined)
    rows.push({
      field: "A/B variants",
      from: countOf(link.ab_variants?.length, "variant"),
      to: countOf(patch.ab_variants?.length, "variant"),
    })
  if (patch.meta_tags !== undefined) {
    const keysOf = (m: UrlListItem["meta_tags"]) =>
      m && Object.keys(m).length ? Object.keys(m).join(", ") : "default"
    rows.push({
      field: "Meta tags",
      from: keysOf(link.meta_tags),
      to: keysOf(patch.meta_tags),
    })
  }
  return rows
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
    <div className="space-y-2">
      <Label className="text-foreground mb-2.5 text-xs font-medium">{label}</Label>
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
  const [passwordVisible, setPasswordVisible] = React.useState(false)

  const [expiry, setExpiry] = React.useState(
    link.expire_after ? toLocalInputValue(new Date(link.expire_after * 1000)) : "",
  )
  const [maxClicks, setMaxClicks] = React.useState(
    link.max_clicks != null ? String(link.max_clicks) : "",
  )
  const [blockBots, setBlockBots] = React.useState(Boolean(link.block_bots))
  const [privateStats, setPrivateStats] = React.useState(Boolean(link.private_stats))

  const [geoRules, setGeoRules] = React.useState<GeoRuleDraft[]>(
    (link.geo_rules ?? []).map((r) => ({ ...r })),
  )
  const [variants, setVariants] = React.useState<VariantDraft[]>(
    (link.ab_variants ?? []).map((v) => ({ url: v.url, weight: String(v.weight) })),
  )
  const [meta, setMeta] = React.useState<MetaDraft>(metaDraftOf(link.meta_tags))

  const aliasChanged = alias !== (link.alias ?? "")
  // idle/invalid/checking derive from the input; only the server verdict
  // lives in state, keyed to the alias it answered so a stale response
  // can't label fresh input.
  const [verdict, setVerdict] = React.useState<{
    alias: string
    available: boolean
  } | null>(null)
  const aliasFormatValid = /^[a-zA-Z0-9_-]{3,16}$/.test(alias)
  React.useEffect(() => {
    if (!alias || !/^[a-zA-Z0-9_-]{3,16}$/.test(alias)) return
    const t = setTimeout(() => {
      checkAlias(alias)
        .then((r) => setVerdict({ alias, available: r.available }))
        .catch(() => {})
    }, 350)
    return () => clearTimeout(t)
  }, [alias])
  const aliasState: "idle" | "checking" | "available" | "taken" | "invalid" =
    !aliasChanged || !alias
      ? "idle"
      : !aliasFormatValid
        ? "invalid"
        : verdict?.alias === alias
          ? verdict.available
            ? "available"
            : "taken"
          : "checking"

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
  // Feature payloads: canonical complete rows vs what the link stores;
  // clearing PATCHes null (explicit removal, same semantics as password).
  const geoPayload = completeGeoRules(geoRules)
  if (JSON.stringify(geoPayload) !== JSON.stringify(link.geo_rules ?? []))
    patch.geo_rules = geoPayload.length ? geoPayload : null
  const variantPayload = completeVariants(variants)
  if (JSON.stringify(variantPayload) !== JSON.stringify(link.ab_variants ?? []))
    patch.ab_variants = variantPayload.length ? variantPayload : null
  const metaPayload = metaTagsOf(meta) ?? null
  if (JSON.stringify(metaPayload) !== JSON.stringify(link.meta_tags ?? null))
    patch.meta_tags = metaPayload

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
      if (err instanceof SpooApiError && err.field === "alias")
        setVerdict({ alias, available: false })
      toast.error(err instanceof Error ? err.message : "Couldn't save changes")
    },
  })

  const canSave =
    dirty &&
    !save.isPending &&
    variantTotal(variants) <= 100 &&
    (!aliasChanged || aliasState === "available" || alias === "") &&
    (passwordMode !== "set" || newPassword.length > 0)

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const changes = describeChanges(link, patch)

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
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-9 shrink-0"
            aria-label="Suggest an alias"
            onClick={() => setAlias(suggestAlias())}
          >
            <Dices />
          </Button>
        </div>
      </Field>

      <Field label="Password">
        {link.password_set && passwordMode === "keep" ? (
          <div className="flex items-center gap-2">
            {link.password ? (
              <PasswordInput
                value={link.password}
                visible={passwordVisible}
                onVisibleChange={setPasswordVisible}
                readOnly
                className="[&_input]:h-9 [&_input]:bg-muted/30"
              />
            ) : (
              <span className="border-border/60 bg-muted/30 text-muted-foreground flex h-9 flex-1 items-center gap-2 rounded-lg border px-3 text-xs">
                <KeyRound className="size-3.5" strokeWidth={1.75} />
                Password is set.
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setPasswordMode("set")
                setPasswordVisible(false)
              }}
              className="text-foreground shrink-0 text-xs underline underline-offset-4"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => setPasswordMode("remove")}
              className="text-destructive shrink-0 text-xs underline underline-offset-4"
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
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              visible={passwordVisible}
              onVisibleChange={setPasswordVisible}
              placeholder={
                link.password_set ? "New password" : "Add a password (optional)"
              }
              className="[&_input]:h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={() => {
                setPasswordMode("set")
                setNewPassword(suggestPassword())
                setPasswordVisible(true)
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
            <DateTimeField
              value={expiry}
              onChange={setExpiry}
              placeholder="Never"
              className="min-w-0 flex-1"
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

      <GeoRulesEditor rules={geoRules} onChange={setGeoRules} />

      <VariantsEditor variants={variants} onChange={setVariants} />

      <div className="space-y-3">
        <div className="label-mono text-muted-foreground/60 text-[10px]">
          Meta tags
        </div>
        <MetaTagsEditor
          value={meta}
          onChange={setMeta}
          domain={domain}
          alias={alias}
          preview="below"
        />
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
        <Button size="sm" disabled={!canSave} onClick={() => setConfirmOpen(true)}>
          Save changes
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="data-[size=default]:sm:max-w-[27rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {changes.length === 1
                ? "One setting changes"
                : `${changes.length} settings change`}{" "}
              on {(link.domain ?? "spoo.me") + "/" + link.alias}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border-border/60 divide-border/60 min-w-0 divide-y rounded-xl border">
            {changes.map((c) => (
              <div
                key={c.field}
                className="flex items-center justify-between gap-4 px-3.5 py-2.5"
              >
                <span className="label-mono text-muted-foreground shrink-0">
                  {c.field}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs">
                  <span className="text-muted-foreground/60 truncate">{c.from}</span>
                  <span className="text-muted-foreground/40 shrink-0">→</span>
                  <span className="text-foreground truncate">{c.to}</span>
                </span>
              </div>
            ))}
          </div>
          {patch.alias !== undefined && (
            <p className="text-destructive/90 flex items-center gap-1.5 text-xs">
              <CircleAlert className="size-3.5 shrink-0" strokeWidth={1.75} />
              The old address /{link.alias} stops working.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => save.mutate()}>
              Save changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
