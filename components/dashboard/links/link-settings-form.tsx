"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { trackLinkUpdated } from "@/lib/analytics"
import {
  fetchUrlMetadata,
  updateUrl,
  SpooApiError,
  type UpdateUrlInput,
  type UrlListItem,
} from "@/lib/api"
import { displayUrl } from "@/lib/format"
import { normalizeUrl, urlProblem } from "@/lib/validation"
import { countGraphemes } from "@/lib/emoji-alias"
import { emojiPolicyHint, useAliasCheck } from "@/hooks/use-alias-check"
import { useAcceptedEmoji } from "@/hooks/use-emoji-set"
import { useFeature } from "@/hooks/use-features"
import { Velvet } from "@/components/shared/velvet"
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
import { InfoHint } from "@/components/dashboard/info-hint"
import { EmojiPicker } from "@/components/dashboard/links/emoji-picker"
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
  geoDraftsOf,
  geoRulesProblem,
  GeoRulesEditor,
  metaDraftOf,
  metaFetchNotice,
  prefillDraftOf,
  prefillHasData,
  sameGeoRules,
  sameMetaTags,
  MetaTagsEditor,
  metaTagsOf,
  metaTagsProblem,
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
    " "
  )
/** Unbiased crypto-random integer in [0, bound). */
function randInt(bound: number) {
  const buf = new Uint32Array(1)
  const limit = Math.floor(4294967296 / bound) * bound
  do {
    crypto.getRandomValues(buf)
  } while (buf[0] >= limit)
  return buf[0] % bound
}
// "." separators: backend URL-password rule requires a letter, a digit and
// an "@" or "." with no two consecutive specials (shared/validators.py).
function suggestPassword() {
  const pick = () => WORDS[randInt(WORDS.length)]
  return `${pick()}.${pick()}.${10 + randInt(89)}`
}
function suggestAlias() {
  return `${WORDS[randInt(WORDS.length)]}-${10 + randInt(89)}`
}

/**
 * Truncate a from/to pair so the point where they diverge stays visible —
 * plain end-truncation would render two long URLs as the same prefix.
 */
function diffTruncate(from: string, to: string, max = 16): [string, string] {
  if (from.length <= max && to.length <= max) return [from, to]
  let p = 0
  while (p < from.length && p < to.length && from[p] === to[p]) p++
  const start = Math.max(
    0,
    Math.min(p - 4, Math.max(from.length, to.length) - max)
  )
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
function describeChanges(
  link: UrlListItem,
  patch: UpdateUrlInput
): ChangeRow[] {
  const rows: ChangeRow[] = []
  const strip = (u: string) => u.replace(/^https?:\/\//, "")
  if (patch.long_url !== undefined) {
    const [from, to] = diffTruncate(
      strip(link.long_url ?? ""),
      strip(patch.long_url)
    )
    rows.push({ field: "Destination", from, to })
  }
  if (patch.alias !== undefined)
    rows.push({
      field: "Short link",
      from: `/${link.alias}`,
      to: `/${patch.alias}`,
    })
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
  if (patch.expired_redirect_url !== undefined)
    rows.push({
      field: "After expiry",
      from: link.expired_redirect_url
        ? displayUrl(link.expired_redirect_url)
        : "expired page",
      to: patch.expired_redirect_url
        ? displayUrl(patch.expired_redirect_url)
        : "expired page",
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
      from: countOf(Object.keys(link.geo_rules ?? {}).length, "rule"),
      to: countOf(Object.keys(patch.geo_rules ?? {}).length, "rule"),
    })
  if (patch.ab_variants !== undefined)
    rows.push({
      field: "A/B variants",
      from: countOf(link.ab_variants?.length, "variant"),
      to: countOf(patch.ab_variants?.length, "variant"),
    })
  if (patch.meta_tags !== undefined) {
    // The echo carries explicit nulls (and warnings) — count set fields only.
    const keysOf = (
      m: UpdateUrlInput["meta_tags"] | UrlListItem["meta_tags"]
    ) => {
      if (!m) return "default"
      const set = (["title", "description", "image", "color"] as const).filter(
        (k) => m[k] != null
      )
      return set.length ? set.join(", ") : "default"
    }
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
  labelHint,
  error,
  children,
}: {
  label: string
  hint?: string
  /** Help glyph after the label (tooltip); for behavior a hint can't carry. */
  labelHint?: React.ReactNode
  /** Blocking problem with the field's value; replaces the hint. */
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      {labelHint ? (
        <span className="mb-2.5 flex items-center gap-1.5">
          <Label className="font-medium text-foreground text-xs">{label}</Label>
          {labelHint}
        </span>
      ) : (
        <Label className="mb-2.5 font-medium text-foreground text-xs">
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : (
        hint && <p className="text-muted-foreground/70 text-xs">{hint}</p>
      )}
    </div>
  )
}

export function LinkSettingsForm({
  link,
  domains = ["spoo.me"],
  onSaved,
  layout = "stack",
}: {
  link: UrlListItem
  domains?: string[]
  onSaved?: (next: UrlListItem) => void
  /** "stack" fits the sheet; "wide" pairs core fields with the feature
      sections side by side on the full link page. */
  layout?: "stack" | "wide"
}) {
  const queryClient = useQueryClient()

  const [longUrl, setLongUrl] = React.useState(link.long_url ?? "")
  const [alias, setAlias] = React.useState(link.alias ?? "")
  const showMeta = useFeature("custom_meta_tags") === "enabled"
  const showDomains = useFeature("custom_domains") === "enabled"
  const [domain, setDomain] = React.useState(link.domain ?? "spoo.me")

  // Password tri-state: keep (untouched) | set new value | remove.
  const [passwordMode, setPasswordMode] = React.useState<
    "keep" | "set" | "remove"
  >("keep")
  const [newPassword, setNewPassword] = React.useState("")
  const [passwordVisible, setPasswordVisible] = React.useState(false)

  const [expiry, setExpiry] = React.useState(
    link.expire_after
      ? toLocalInputValue(new Date(link.expire_after * 1000))
      : ""
  )
  const [maxClicks, setMaxClicks] = React.useState(
    link.max_clicks != null ? String(link.max_clicks) : ""
  )
  const [fallbackUrl, setFallbackUrl] = React.useState(
    link.expired_redirect_url ?? ""
  )
  const [blockBots, setBlockBots] = React.useState(Boolean(link.block_bots))
  const [privateStats, setPrivateStats] = React.useState(
    Boolean(link.private_stats)
  )

  const [geoRules, setGeoRules] = React.useState<GeoRuleDraft[]>(
    geoDraftsOf(link.geo_rules)
  )
  const [variants, setVariants] = React.useState<VariantDraft[]>(
    (link.ab_variants ?? []).map((v) => ({
      url: v.url,
      weight: String(v.weight),
    }))
  )
  const [meta, setMeta] = React.useState<MetaDraft>(metaDraftOf(link.meta_tags))
  // Customized = this link freezes its own tags (meta_tags set on the wire,
  // or a manual edit in this form). While false the fields merely MIRROR
  // the destination's live tags (fetched below, display only — an untouched
  // form never PATCHes). A customized link is hard-frozen: no fetch, no
  // overwrite. "Reset to destination" flips back and PATCHes null on save.
  const [metaCustomized, setMetaCustomized] = React.useState(
    Boolean(link.meta_tags)
  )

  // Destination-tag mirror (GET /api/v1/metadata): only for accounts with
  // the feature (nothing below renders without it, so the fetch would be
  // pure waste) and only for uncustomized links, debounced against
  // destination edits; retry off and staleTime generous — the endpoint is
  // 20/min rate-limited and it fetches the destination server-side.
  const [debouncedUrl, setDebouncedUrl] = React.useState(normalizeUrl(longUrl))
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedUrl(normalizeUrl(longUrl)), 600)
    return () => clearTimeout(t)
  }, [longUrl])
  const metaFetchUrl =
    debouncedUrl.startsWith("https://") && !urlProblem(debouncedUrl)
      ? debouncedUrl
      : null
  const destMeta = useQuery({
    queryKey: ["url-metadata", metaFetchUrl],
    queryFn: () => fetchUrlMetadata(metaFetchUrl!),
    enabled: showMeta && !metaCustomized && Boolean(metaFetchUrl),
    staleTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })
  // Prefill is never a dirty bit: while uncustomized the DISPLAYED draft is
  // derived straight from the fetch (no effect, no state write) — a new
  // destination clears it, a resolve fills it (clamped), reset falls back
  // to it from the cache. The first manual edit snapshots it into `meta`
  // via onChange and flips customized.
  const displayedMeta = metaCustomized ? meta : prefillDraftOf(destMeta.data)

  const aliasChanged = alias !== (link.alias ?? "")
  // Live availability via the shared hook — only a CHANGED alias is checked.
  // Send the domain to check-alias only when it is a CUSTOM domain (any option
  // past the first/system-default entry); the default goes with no domain
  // param or the backend 404s it.
  const defaultDomain = domains[0]
  const aliasVerdict = useAliasCheck({
    alias,
    domain: domain === defaultDomain ? undefined : domain,
    enabled: aliasChanged,
  })
  // Accepted set for naming a specific unsupported emoji in the hint.
  const acceptedEmoji = useAcceptedEmoji()
  // Create-time alias rejections carry the server's message, keyed to the
  // alias/domain they answered so fresh input clears them.
  const [serverAliasError, setServerAliasError] = React.useState<{
    alias: string
    domain: string
    message: string
  } | null>(null)
  // Server-side destination verdicts (the DB blocklist can't be mirrored
  // client-side) render inline like every other URL problem — keyed to the
  // URL they rejected, so fresh input clears them.
  const [serverUrlError, setServerUrlError] = React.useState<{
    url: string
    message: string
  } | null>(null)
  const [serverFallbackError, setServerFallbackError] = React.useState<
    string | null
  >(null)
  const aliasServerMsg =
    serverAliasError &&
    serverAliasError.alias === alias &&
    serverAliasError.domain === domain
      ? serverAliasError.message
      : null

  const patch: UpdateUrlInput = {}
  if (normalizeUrl(longUrl) !== (link.long_url ?? ""))
    patch.long_url = normalizeUrl(longUrl)
  if (aliasChanged && alias) patch.alias = alias
  // Both sides normalize to the wire shape (null == system default) before
  // comparing: the stored link always carries a real fqdn, since the
  // backend's UrlV2Doc.domain is non-nullable.
  const wireDomain = domain === defaultDomain ? null : domain
  const linkWireDomain =
    !link.domain || link.domain === defaultDomain ? null : link.domain
  if (wireDomain !== linkWireDomain) patch.domain = wireDomain
  if (passwordMode === "set" && newPassword) patch.password = newPassword
  if (passwordMode === "remove") patch.password = null
  // Compare in the input's own minute precision: expire_after can carry
  // seconds the datetime-local field can't express, and comparing raw
  // seconds made such links open already-dirty.
  const linkExpiryLocal = link.expire_after
    ? toLocalInputValue(new Date(link.expire_after * 1000))
    : ""
  if (expiry !== linkExpiryLocal)
    patch.expire_after = expiry
      ? Math.floor(new Date(expiry).getTime() / 1000)
      : null
  const maxClicksVal = maxClicks === "" ? null : Number(maxClicks)
  if (maxClicksVal !== (link.max_clicks ?? null))
    patch.max_clicks = maxClicksVal
  const fallbackVal = fallbackUrl.trim() ? normalizeUrl(fallbackUrl) : null
  if (fallbackVal !== (link.expired_redirect_url ?? null))
    patch.expired_redirect_url = fallbackVal
  if (blockBots !== Boolean(link.block_bots)) patch.block_bots = blockBots
  if (privateStats !== Boolean(link.private_stats))
    patch.private_stats = privateStats
  // Feature payloads: canonical complete rows vs what the link stores;
  // clearing PATCHes null (explicit removal, same semantics as password).
  const geoPayload = completeGeoRules(geoRules)
  if (!sameGeoRules(geoPayload, link.geo_rules))
    patch.geo_rules = Object.keys(geoPayload).length ? geoPayload : null
  const variantPayload = completeVariants(variants)
  if (JSON.stringify(variantPayload) !== JSON.stringify(link.ab_variants ?? []))
    patch.ab_variants = variantPayload.length ? variantPayload : null
  // Uncustomized = inherit live tags: the mirrored prefill never travels,
  // so the payload is null and an untouched form stays clean. Resetting a
  // previously-customized link makes null differ from the echo → PATCH null.
  const metaPayload = metaCustomized ? (metaTagsOf(meta) ?? null) : null
  if (!sameMetaTags(metaPayload, link.meta_tags)) patch.meta_tags = metaPayload
  const metaProblem = metaCustomized ? metaTagsProblem(meta) : null
  // Mirroring = uncustomized with a fetch worth showing: the header's
  // live dot says so; an empty or failed fetch stays bare (the notice
  // covers errors).
  const metaMirroring =
    !metaCustomized && destMeta.isSuccess && prefillHasData(destMeta.data)
  const metaSource = prefillDraftOf(destMeta.data)
  const metaNotice =
    !metaCustomized && destMeta.isError ? metaFetchNotice(destMeta.error) : null

  const dirty = Object.keys(patch).length > 0

  // Destination mirror of the backend rules (lib/validation.ts) — judged
  // only while the field is actually dirty, and spoken once typing settles
  // (same debounce as the metadata fetch) so edits aren't scolded midway.
  const destProblem =
    patch.long_url === undefined
      ? null
      : longUrl.trim() === ""
        ? "Enter a destination URL."
        : ((debouncedUrl === normalizeUrl(longUrl)
            ? urlProblem(longUrl)
            : null) ??
          (serverUrlError && serverUrlError.url === normalizeUrl(longUrl)
            ? serverUrlError.message
            : null))

  const fallbackProblem =
    patch.expired_redirect_url === undefined || !fallbackUrl.trim()
      ? null
      : (urlProblem(fallbackUrl) ?? serverFallbackError)

  const save = useMutation({
    mutationFn: () => updateUrl(link.id, patch),
    onSuccess: (next) => {
      trackLinkUpdated(patch)
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      // Single-resource reads live under a separate ["url", domain, alias]
      // prefix, and the detail header and off-page sheet both render from
      // one. Without this they keep showing pre-save values.
      queryClient.invalidateQueries({ queryKey: ["url"] })
      setPasswordMode("keep")
      setNewPassword("")
      // A data-URI upload echoes back as a rehosted CDN https URL — adopt
      // the echo so the draft matches what the link now stores (otherwise
      // the form would sit dirty against a value that can never re-match).
      if (patch.meta_tags !== undefined) {
        setMeta(metaDraftOf(next.meta_tags))
        setMetaCustomized(Boolean(next.meta_tags))
      }
      toast.success("Link updated")
      onSaved?.(next)
    },
    onError: (err) => {
      if (err instanceof SpooApiError && err.field === "long_url") {
        // Blocklist (and any other server-only) rejections render inline
        // under the destination field, not as a toast.
        setServerUrlError({
          url: normalizeUrl(longUrl),
          message:
            err.message === "URL is blocked"
              ? "That destination is blocked on spoo.me."
              : err.message,
        })
        return
      }
      if (err instanceof SpooApiError && err.field === "alias") {
        setServerAliasError({ alias, domain, message: err.message })
        return
      }
      if (err instanceof SpooApiError && err.field === "expired_redirect_url") {
        setServerFallbackError(
          err.message === "URL is blocked"
            ? "That fallback is blocked on spoo.me."
            : err.message
        )
        return
      }
      toast.error(err instanceof Error ? err.message : "Couldn't save changes")
    },
  })

  // canSave derives from this, so every veto ships with its explanation —
  // including validators whose editors are feature-gated out of the DOM.
  const saveBlocker = (() => {
    if (!dirty || save.isPending) return null
    if (
      patch.long_url !== undefined &&
      (longUrl.trim() === "" ||
        urlProblem(longUrl) ||
        (serverUrlError && serverUrlError.url === normalizeUrl(longUrl)))
    )
      return "Fix the destination to save."
    if (aliasServerMsg) return "Fix the short link to save."
    if (aliasChanged && alias !== "") {
      if (aliasVerdict.state === "checking") return "Checking the alias…"
      if (aliasVerdict.state === "problem") return "Fix the short link to save."
    }
    if (variantTotal(variants) > 100) return "A/B split exceeds 100%."
    if (geoRulesProblem(geoRules)) return "Fix the geo rules to save."
    if (fallbackProblem) return "Fix the fallback URL to save."
    if (metaProblem) return "Fix the link preview to save."
    return null
  })()

  const canSave = dirty && !save.isPending && saveBlocker === null

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const changes = describeChanges(link, patch)

  return (
    <div
      className={
        layout === "wide"
          ? "grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-x-10"
          : "space-y-5"
      }
    >
      <div className="space-y-5">
        <Field
          label="Destination"
          error={destProblem}
          hint="Where the short link sends visitors."
        >
          <Input
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            spellCheck={false}
            className="h-9 font-mono text-xs"
          />
        </Field>

        <Field
          label="Short link"
          labelHint={
            <InfoHint label="What can be an alias">
              Aliases are letters and numbers, or 1-15 emoji. Only emoji that
              render in every browser&apos;s address bar are accepted, so flags
              and multi-person combos are out.
            </InfoHint>
          }
          error={
            // Client verdicts that block saving speak in the error voice;
            // as a muted hint they read as advisory and the greyed Save
            // button goes unexplained.
            aliasServerMsg ??
            (aliasChanged && alias !== "" && aliasVerdict.state === "problem"
              ? aliasVerdict.reason === "emoji_policy"
                ? emojiPolicyHint(alias, acceptedEmoji)
                : aliasVerdict.message
              : null)
          }
          hint={
            aliasVerdict.state === "available"
              ? `${domain}/${alias} is available.`
              : "Changing the alias breaks the old address."
          }
        >
          <div className="flex items-center gap-1.5">
            {showDomains ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-2.5 font-mono text-foreground text-xs transition-colors duration-150 hover:bg-accent/60"
                  >
                    {domain}
                    <ChevronDown className="size-3 text-muted-foreground" />
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
            ) : (
              <span className="flex h-9 shrink-0 items-center rounded-lg border border-border/60 bg-muted/40 px-2.5 font-mono text-foreground text-xs">
                {domain}
              </span>
            )}
            <span className="font-mono text-muted-foreground text-xs">/</span>
            <div className="relative flex-1">
              <Input
                value={alias}
                onChange={(e) => setAlias(e.target.value.replace(/\s+/g, ""))}
                spellCheck={false}
                className="h-9 pr-8 font-mono text-xs"
              />
              <span className="absolute top-1/2 right-2.5 -translate-y-1/2">
                {aliasVerdict.state === "checking" && (
                  <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" />
                )}
                {aliasVerdict.state === "available" && (
                  <Check className="size-3.5 text-live" />
                )}
                {(aliasVerdict.state === "problem" || aliasServerMsg) && (
                  <CircleAlert className="size-3.5 text-destructive" />
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
            <EmojiPicker
              remaining={15 - countGraphemes(alias)}
              onPick={(emoji) => setAlias((a) => a.replace(/\s+/g, "") + emoji)}
            />
          </div>
        </Field>

        <Field
          label="Password"
          labelHint={
            <InfoHint label="How the password is stored">
              The password is hashed and never shown; replace or remove it,
              don&apos;t edit it.
            </InfoHint>
          }
        >
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
                <span className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 text-muted-foreground text-xs">
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
                className="shrink-0 text-foreground text-xs underline underline-offset-4"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setPasswordMode("remove")}
                className="shrink-0 text-destructive text-xs underline underline-offset-4"
              >
                Remove
              </button>
            </div>
          ) : passwordMode === "remove" ? (
            <div className="flex h-9 items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3">
              <span className="flex-1 text-destructive text-xs">
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
                // Typing IS the intent to set one. Only Suggest used to move
                // the mode, so a typed password left it on "keep", the patch
                // never carried `password`, and the form read as unchanged.
                // Emptying only relaxes back to "keep" when no password is
                // stored, where both modes render this same field. On a link
                // that has one, "keep" is the summary row, so relaxing would
                // yank the input out from under the cursor mid-edit.
                onChange={(v) => {
                  setNewPassword(v)
                  if (v) setPasswordMode("set")
                  else if (!link.password_set) setPasswordMode("keep")
                }}
                visible={passwordVisible}
                onVisibleChange={setPasswordVisible}
                placeholder={
                  link.password_set
                    ? "New password"
                    : "Add a password (optional)"
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
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Expires"
            hint="The link stops redirecting after this moment."
          >
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
          <Field
            label="Max clicks"
            hint="The link deactivates after this many clicks."
          >
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

        <Velvet feature="expired_fallback">
          <Field
            label="After expiry"
            hint="Where visitors land once the link has expired, by time or by click limit."
            error={fallbackProblem}
          >
            <div className="flex items-center gap-1.5">
              <Input
                type="url"
                inputMode="url"
                value={fallbackUrl}
                onChange={(e) => {
                  setServerFallbackError(null)
                  setFallbackUrl(e.target.value)
                }}
                placeholder="Expired page"
                className="h-9 font-mono text-xs"
              />
              {fallbackUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove fallback URL"
                  onClick={() => {
                    setServerFallbackError(null)
                    setFallbackUrl("")
                  }}
                >
                  <X />
                </Button>
              )}
            </div>
          </Field>
        </Velvet>

        <div className="divide-y divide-border/60 rounded-xl border border-border/60">
          <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
            <span>
              <span className="block font-medium text-foreground text-xs">
                Block bots
              </span>
              <span className="text-muted-foreground/70 text-xs">
                Crawlers get a preview page instead of the redirect.
              </span>
            </span>
            <Switch checked={blockBots} onCheckedChange={setBlockBots} />
          </label>
          <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
            <span>
              <span className="block font-medium text-foreground text-xs">
                Private stats
              </span>
              <span className="text-muted-foreground/70 text-xs">
                Only you can see this link&apos;s analytics.
              </span>
            </span>
            <Switch checked={privateStats} onCheckedChange={setPrivateStats} />
          </label>
        </div>
      </div>

      <div className="space-y-5">
        <Velvet feature="geo_targeting">
          <GeoRulesEditor rules={geoRules} onChange={setGeoRules} />
        </Velvet>

        <Velvet feature="ab_testing">
          <VariantsEditor variants={variants} onChange={setVariants} />
        </Velvet>

        {showMeta && (
          <div className="space-y-3">
            {/* Fixed-height header row: the live-dot status and reset action
            swap in place, zero layout shift either way. */}
            <div className="flex h-7 items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="flex items-center gap-1.5">
                  <div className="label-mono text-[10px] text-muted-foreground/60">
                    Meta tags
                  </div>
                  <InfoHint label="What meta tags do">
                    The social card crawlers see when this link is shared;
                    overrides the destination&apos;s own card.
                  </InfoHint>
                </span>
                {metaMirroring && (
                  <span className="flex items-center gap-1.5">
                    <span className="label-mono text-[10px] text-muted-foreground/40">
                      fetched from destination
                    </span>
                    <InfoHint label="About fetched meta tags">
                      These preview tags are read live from the destination
                      until you customize them.
                    </InfoHint>
                  </span>
                )}
              </div>
              {metaCustomized && (
                <button
                  type="button"
                  onClick={() => setMetaCustomized(false)}
                  className="text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
                >
                  Reset to destination
                </button>
              )}
            </div>
            <MetaTagsEditor
              value={displayedMeta}
              onChange={(v) => {
                // Any manual edit — typing, clearing, a color pick — flips
                // customized; the mirror effect goes through setMeta only.
                setMeta(v)
                setMetaCustomized(true)
              }}
              domain={domain}
              alias={alias}
              preview="below"
              loading={!metaCustomized && destMeta.isFetching}
              notice={metaNotice}
              problem={metaProblem}
              source={metaCustomized ? metaSource : undefined}
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex items-center justify-end gap-2 transition-opacity duration-150",
          layout === "wide" && "lg:col-span-2",
          dirty ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <span
          className={cn(
            "mr-auto text-xs",
            saveBlocker ? "text-foreground" : "text-muted-foreground/70"
          )}
        >
          {save.isPending ? "Saving…" : (saveBlocker ?? "Unsaved changes")}
        </span>
        <Button
          size="sm"
          disabled={!canSave}
          onClick={() => setConfirmOpen(true)}
        >
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
          <div className="min-w-0 divide-y divide-border/60 rounded-xl border border-border/60">
            {changes.map((c) => (
              <div
                key={c.field}
                className="flex items-center justify-between gap-4 px-3.5 py-2.5"
              >
                <span className="label-mono shrink-0 text-muted-foreground">
                  {c.field}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs">
                  <span className="truncate text-muted-foreground/60">
                    {c.from}
                  </span>
                  <span className="shrink-0 text-muted-foreground/40">→</span>
                  <span className="truncate text-foreground">{c.to}</span>
                </span>
              </div>
            ))}
          </div>
          {patch.alias !== undefined && (
            <p className="flex items-center gap-1.5 text-destructive/90 text-xs">
              <CircleAlert className="size-3.5 shrink-0" strokeWidth={1.75} />
              The old address /{link.alias} stops working.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              Save changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
