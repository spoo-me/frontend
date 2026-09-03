"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "motion/react"
import {
  Check,
  ChevronDown,
  CircleAlert,
  CornerDownLeft,
  Crosshair,
  Dices,
  Link2,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Tags,
} from "lucide-react"
import { toast } from "sonner"

import { trackLinkCreated, trackUiAction } from "@/lib/analytics"
import {
  fetchUrlMetadata,
  listCustomDomains,
  shorten,
  SpooApiError,
  type CustomDomain,
  type ShortenInput,
} from "@/lib/api"
import { urlProblem } from "@/lib/validation"
import { countGraphemes, suggestEmojiAlias } from "@/lib/emoji-alias"
import { emojiPolicyHint, useAliasCheck } from "@/hooks/use-alias-check"
import { useCreateOptionTracker } from "@/hooks/use-create-option-tracker"
import { useAcceptedEmoji, useGenerateEmoji } from "@/hooks/use-emoji-set"
import { useFeature } from "@/hooks/use-features"
import { Velvet } from "@/components/shared/velvet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DateTimeField } from "@/components/dashboard/date-time-field"
import { PasswordInput } from "@/components/dashboard/password-input"
import { Kbd } from "@/components/dashboard/kbd"
import { InfoHint } from "@/components/dashboard/info-hint"
import { EmojiPicker } from "@/components/dashboard/links/emoji-picker"
import { notifyLinkCreated } from "@/components/dashboard/links/create-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  completeGeoRules,
  completeVariants,
  emptyMetaDraft,
  geoRulesProblem,
  GeoRulesEditor,
  looksLikeUrl,
  metaFetchNotice,
  MetaTagsEditor,
  metaTagsOf,
  metaTagsProblem,
  normalizeUrl,
  prefillDraftOf,
  prefillHasData,
  SectionLabel,
  VariantsEditor,
  variantTotal,
  type GeoRuleDraft,
  type MetaDraft,
  type VariantDraft,
} from "@/components/dashboard/links/link-feature-editors"

const OPEN_EVENT = "spoo:new-link"

export function openLinkComposer(opts?: { domain?: string; longUrl?: string }) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: opts }))
}

/** Suggesters: memorable words, no lookalike characters. */
const WORDS =
  "amber anchor basil beacon birch bishop bramble bronze cedar cinder cobalt comet copper coral cypress delta dune ember fable falcon fennel fjord garnet gossamer granite harbor hazel heron indigo ivory juniper kelp koala lantern larch lichen lumen maple marble meadow nectar nimbus onyx opal orchid otter pebble pewter pixel quartz quill raven reef rowan sable saffron slate sorrel spruce thistle topaz tundra umber velvet willow zephyr zinc".split(
    " "
  )
/** Unbiased crypto-random integer in [0, bound). */
const randInt = (bound: number) => {
  const buf = new Uint32Array(1)
  const limit = Math.floor(4294967296 / bound) * bound
  do {
    crypto.getRandomValues(buf)
  } while (buf[0] >= limit)
  return buf[0] % bound
}
const pickWord = () => WORDS[randInt(WORDS.length)]
// "." separators: backend URL-password rule requires a letter, a digit and
// an "@" or "." with no two consecutive specials (shared/validators.py).
// Three words and three digits from a 64-word list: about 28 bits, where
// two words and two digits was under 16, small enough to walk online.
const suggestPassword = () =>
  `${pickWord()}.${pickWord()}.${pickWord()}.${100 + randInt(900)}`
const suggestAlias = () => `${pickWord()}-${10 + randInt(89)}`

const EXPIRY_PRESETS: Array<[label: string, hours: number]> = [
  ["1 day", 24],
  ["7 days", 168],
  ["30 days", 720],
]

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Same field anatomy as the link settings form — create and edit are
    siblings and should read as one product. */
function Field({
  label,
  hint,
  error,
  labelHint,
  children,
}: {
  label: string
  hint?: string
  /** Blocking problem with the field's value; replaces the hint. */
  error?: string | null
  /** Help glyph after the label, for behavior a hint line can't carry. */
  labelHint?: React.ReactNode
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

export function LinkComposer() {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState("basic")
  // Deliberate option use, noted at the interaction (set <-> cleared edges
  // only) — the submit-time link_created booleans can't tell a considered
  // default from an option nobody touched.
  const optionUse = useCreateOptionTracker("composer")

  // Backend-gated capabilities: hidden features simply don't exist here.
  const showGeo = useFeature("geo_targeting") === "enabled"
  const showVariants = useFeature("ab_testing") === "enabled"
  const showMeta = useFeature("custom_meta_tags") === "enabled"
  const showDomains = useFeature("custom_domains") === "enabled"
  const showTargeting = showGeo || showVariants
  const tabOrder = [
    "basic",
    "security",
    ...(showTargeting ? ["targeting"] : []),
    ...(showMeta ? ["metadata"] : []),
  ] as const
  // Derived, not synced: if features settle mid-session and remove the
  // active tab, rendering falls back to basic without an effect.
  const activeTab = tabOrder.includes(tab as (typeof tabOrder)[number])
    ? tab
    : "basic"

  const [longUrl, setLongUrl] = React.useState("")
  const [alias, setAlias] = React.useState("")
  const [domain, setDomain] = React.useState("spoo.me")
  const [password, setPassword] = React.useState("")
  const [passwordVisible, setPasswordVisible] = React.useState(false)
  const [expiry, setExpiry] = React.useState("")
  const [maxClicks, setMaxClicks] = React.useState("")
  const [fallbackUrl, setFallbackUrl] = React.useState("")
  // One draft row ready to fill: an empty section behind an add-button is
  // a click tax; incomplete drafts never travel.
  const [geoRules, setGeoRules] = React.useState<GeoRuleDraft[]>([
    { country: "", url: "" },
  ])
  const [variants, setVariants] = React.useState<VariantDraft[]>([
    { url: "", weight: "" },
  ])
  const [meta, setMeta] = React.useState<MetaDraft>(emptyMetaDraft())
  // Dub-model prefill: while false the meta fields simply MIRROR the
  // destination fetch (display only — nothing travels on submit, the link
  // keeps inheriting live tags). The first manual edit flips it and the
  // draft is the user's from then on: auto-fill never writes again and
  // submit sends meta_tags. "Reset to destination" flips it back.
  const [metaCustomized, setMetaCustomized] = React.useState(false)
  const [blockBots, setBlockBots] = React.useState(false)
  const [privateStats, setPrivateStats] = React.useState(false)
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

  // Destination-tag prefill (GET /api/v1/metadata, PR #231). The long URL
  // debounces ~600ms into a stable key; the fetch itself only runs while
  // the metadata tab is showing, so the quick-shorten happy path costs
  // zero metadata requests. staleTime is generous and retry off — the
  // endpoint is 20/min rate-limited and tags rarely change mid-session.
  const [debouncedUrl, setDebouncedUrl] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedUrl(normalizeUrl(longUrl))
    }, 600)
    return () => clearTimeout(t)
  }, [longUrl])
  const metaFetchUrl =
    debouncedUrl.startsWith("https://") && !urlProblem(debouncedUrl)
      ? debouncedUrl
      : null
  const destMeta = useQuery({
    queryKey: ["url-metadata", metaFetchUrl],
    queryFn: () => fetchUrlMetadata(metaFetchUrl!),
    enabled: open && activeTab === "metadata" && Boolean(metaFetchUrl),
    staleTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Prefill is never a dirty bit: while uncustomized the DISPLAYED draft is
  // derived straight from the fetch (no effect, no state write) — a new URL
  // clears it, a resolve fills it (clamped via prefillDraftOf), reset falls
  // back to it from the cache. The first manual edit snapshots it into
  // `meta` via onChange and flips customized.
  const displayedMeta = metaCustomized ? meta : prefillDraftOf(destMeta.data)

  React.useEffect(() => {
    const onOpen = (e: Event) => {
      // reset() ran on close, so a preset here can't leak between opens.
      const preset = (
        e as CustomEvent<{ domain?: string; longUrl?: string } | undefined>
      ).detail
      if (preset?.longUrl) setLongUrl(preset.longUrl)
      if (preset?.domain) {
        setDomain(preset.domain)
      } else {
        // Context default: any entry point (topbar, N, palette) used while
        // standing on a live domain's page starts the link on that domain.
        const id = pathname.match(/^\/dashboard\/domains\/([^/]+)$/)?.[1]
        const dom = id
          ? queryClient.getQueryData<CustomDomain>(["domains", id])
          : undefined
        if (dom?.status === "ACTIVE") setDomain(dom.fqdn)
      }
      setOpen(true)
    }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [pathname, queryClient])

  const reset = () => {
    setTab("basic")
    setLongUrl("")
    setAlias("")
    setDomain("spoo.me")
    setPassword("")
    setExpiry("")
    setMaxClicks("")
    setFallbackUrl("")
    setServerFallbackError(null)
    setGeoRules([{ country: "", url: "" }])
    setVariants([{ url: "", weight: "" }])
    setMeta(emptyMetaDraft())
    setMetaCustomized(false)
    setBlockBots(false)
    setPrivateStats(false)
    setDebouncedUrl("")
    setServerUrlError(null)
    optionUse.reset()
  }

  // Animated tab height: measure the active panel, glide the container.
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [panelH, setPanelH] = React.useState<number | undefined>(undefined)
  React.useEffect(() => {
    if (!open) return
    const el = panelRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setPanelH(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  // Active custom domains join the alias control (integrated, ref SPEC §5).
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
    enabled: open && showDomains,
    staleTime: 60_000,
  })
  // The system default is the first entry; custom domains follow it.
  const customDomains = new Set(
    domains.data?.items
      .filter((d) => d.status === "ACTIVE")
      .map((d) => d.fqdn) ?? []
  )
  const activeDomains = ["spoo.me", ...customDomains]

  // Live alias availability via the shared hook (debounced, domain-scoped).
  // Only a CUSTOM domain is sent to check-alias; the system default must go
  // with no domain param (the backend 404s a non-default domain that is not an
  // owned custom domain). Create-time alias rejections are kept separately,
  // keyed to the alias they answered so fresh input clears them and the
  // server's message shows through.
  const aliasVerdict = useAliasCheck({
    alias,
    domain: customDomains.has(domain) ? domain : undefined,
  })
  const [serverAliasError, setServerAliasError] = React.useState<{
    alias: string
    domain: string
    message: string
  } | null>(null)
  // Only the cap is load-bearing for the picker; a running count is not shown
  // in the hint (a trailing "N of 15" reads as helper-chrome at low counts).
  const aliasGraphemes = countGraphemes(alias)
  const aliasServerMsg =
    serverAliasError &&
    serverAliasError.alias === alias &&
    serverAliasError.domain === domain
      ? serverAliasError.message
      : null
  // Name the specific unsupported emoji for the emoji_policy case, from the
  // fetched accepted set; every other problem keeps the hook's copy.
  const acceptedEmoji = useAcceptedEmoji()
  // Dice emoji suggestions draw from the server auto-gen pool once loaded;
  // the curated pool is only the pre-load fallback.
  const generateEmoji = useGenerateEmoji()
  const aliasHint =
    aliasVerdict.state === "available"
      ? `${domain}/${alias} is available.`
      : aliasVerdict.state === "problem"
        ? aliasVerdict.reason === "emoji_policy"
          ? emojiPolicyHint(alias, acceptedEmoji)
          : aliasVerdict.message
        : "Leave the alias empty for a random one."

  const geoPayload = completeGeoRules(geoRules)
  const geoCount = Object.keys(geoPayload).length
  const geoProblem = geoRulesProblem(geoRules)
  const fallbackProblem = fallbackUrl.trim()
    ? (urlProblem(fallbackUrl) ?? serverFallbackError)
    : null
  const variantPayload = completeVariants(variants)
  // Uncustomized = inherit the destination's live tags: the (display-only)
  // prefill never travels and never blocks submit.
  const metaPayload = metaCustomized ? metaTagsOf(meta) : undefined
  const metaProblem = metaCustomized ? metaTagsProblem(meta) : null
  // Mirroring = uncustomized with a fetch worth showing: the header's
  // live dot says so; an empty or failed fetch stays bare (the notice
  // covers errors).
  const metaMirroring =
    !metaCustomized && destMeta.isSuccess && prefillHasData(destMeta.data)
  const metaSource = prefillDraftOf(destMeta.data)
  const metaNotice =
    !metaCustomized && destMeta.isError ? metaFetchNotice(destMeta.error) : null
  const weights = variantTotal(variants)

  const create = useMutation({
    // The payload arrives as mutate() variables so onSuccess can hand the
    // exact request to analytics.
    mutationFn: (input: ShortenInput) => shorten(input),
    onSuccess: (created, input) => {
      trackLinkCreated(input, "composer")
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      setOpen(false)
      reset()
      notifyLinkCreated(created.short_url)
    },
    onError: (err) => {
      if (err instanceof SpooApiError && err.field === "alias") {
        setTab("basic")
        // The backend's 400/422 alias messages are user-grade; surface it
        // instead of assuming "taken".
        setServerAliasError({ alias, domain, message: err.message })
      } else if (err instanceof SpooApiError && err.field === "long_url") {
        setTab("basic")
        setServerUrlError({
          url: normalizeUrl(longUrl),
          message:
            err.message === "URL is blocked"
              ? "That destination is blocked on spoo.me."
              : err.message,
        })
      } else if (
        err instanceof SpooApiError &&
        err.field === "expired_redirect_url"
      ) {
        setTab("basic")
        setServerFallbackError(
          err.message === "URL is blocked"
            ? "That fallback is blocked on spoo.me."
            : err.message
        )
      } else {
        toast.error(
          err instanceof Error ? err.message : "Couldn't create the link"
        )
      }
    },
  })

  const canCreate =
    longUrl.trim() !== "" &&
    !urlProblem(longUrl) &&
    !create.isPending &&
    weights <= 100 &&
    !geoProblem &&
    !fallbackProblem &&
    !metaProblem &&
    (alias === "" ||
      aliasVerdict.state === "available" ||
      aliasVerdict.state === "checking" ||
      // Indeterminate (check couldn't complete): don't hard-block; the
      // backend re-validates on create.
      aliasVerdict.state === "unknown")

  const submit = () => {
    if (!canCreate) return
    create.mutate({
      long_url: normalizeUrl(longUrl),
      ...(alias ? { alias } : {}),
      ...(domain !== "spoo.me" ? { domain } : {}),
      ...(password ? { password } : {}),
      ...(expiry
        ? { expire_after: Math.floor(new Date(expiry).getTime() / 1000) }
        : {}),
      ...(maxClicks ? { max_clicks: Number(maxClicks) } : {}),
      ...(fallbackUrl.trim()
        ? { expired_redirect_url: normalizeUrl(fallbackUrl) }
        : {}),
      ...(blockBots ? { block_bots: true } : {}),
      ...(privateStats ? { private_stats: true } : {}),
      ...(geoCount ? { geo_rules: geoPayload } : {}),
      ...(variantPayload.length ? { ab_variants: variantPayload } : {}),
      ...(metaPayload ? { meta_tags: metaPayload } : {}),
    })
  }

  const normalized = normalizeUrl(longUrl)
  // The client mirror speaks only once typing settles (same debounce as the
  // metadata fetch) so half-typed URLs aren't scolded; the server verdict
  // stays pinned to the exact URL it rejected.
  const destProblem =
    (longUrl.trim() && debouncedUrl === normalized
      ? urlProblem(longUrl)
      : null) ??
    (serverUrlError && serverUrlError.url === normalized
      ? serverUrlError.message
      : null)
  const showNormalization =
    longUrl.trim().length > 3 &&
    normalized !== longUrl.trim() &&
    looksLikeUrl(longUrl)

  const basicSet = expiry !== "" || maxClicks !== "" || fallbackUrl !== ""
  const securitySet = password !== "" || blockBots || privateStats
  const targetingSet = geoCount > 0 || variantPayload.length > 0

  /** The dot = this tab holds a value; visible without visiting it. */
  const tabDot = (set: boolean) =>
    set ? (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Padded hit area; the visible dot stays size-1.5. */}
          <span className="-m-1 flex size-3.5 items-center justify-center p-1">
            <span className="size-1.5 rounded-full bg-brand" />
          </span>
        </TooltipTrigger>
        <TooltipContent>This tab has a value set.</TooltipContent>
      </Tooltip>
    ) : null

  /** shadcn tab trigger with the active cell SLIDING between tabs (same
      layout-animation grammar as Segmented) instead of teleporting. */
  const tabTrigger = (
    value: string,
    Icon: React.ElementType,
    label: string,
    isSet = false
  ) => (
    <TabsTrigger
      value={value}
      className="data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
    >
      {activeTab === value && (
        <motion.span
          layoutId="composer-active-tab"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0 rounded-md border border-transparent bg-background shadow-sm dark:border-input dark:bg-input/30 dark:shadow-none"
        />
      )}
      <span className="relative flex items-center gap-1.5">
        <Icon data-icon="inline-start" />
        <span className="max-sm:sr-only">{label}</span>
        {tabDot(isSet)}
      </span>
    </TabsTrigger>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogContent
        className="sm:max-w-2xl"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
          // Figma/Notion grammar: mod+1..4 jumps between the dialog's tabs.
          if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "4") {
            e.preventDefault()
            const target = tabOrder[Number(e.key) - 1]
            if (target) setTab(target)
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>New link</DialogTitle>
          <DialogDescription>
            Everything except the destination is optional.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(t) => {
            // Exploration signal: opening a feature tab, even without saving.
            if (t !== "basic") trackUiAction("composer_tab_opened", t)
            setTab(t)
          }}
        >
          <TabsList className="w-full">
            {tabTrigger("basic", Link2, "Basic", basicSet)}
            {tabTrigger("security", ShieldCheck, "Security", securitySet)}
            {showTargeting &&
              tabTrigger("targeting", Crosshair, "Targeting", targetingSet)}
            {showMeta &&
              tabTrigger("metadata", Tags, "Metadata", Boolean(metaPayload))}
          </TabsList>

          {/* Each tab sizes to its content; the height glides between
              tabs (response to a click, not a shift). */}
          <div
            style={{ height: panelH }}
            className="overflow-hidden transition-[height] duration-200 ease-out"
          >
            <div ref={panelRef} className="min-h-[392px] pt-3">
              <TabsContent value="basic" className="space-y-5">
                <Field
                  label="Destination"
                  error={destProblem}
                  hint={
                    showNormalization ? `Saved as ${normalized}` : undefined
                  }
                >
                  <Textarea
                    value={longUrl}
                    onChange={(e) =>
                      setLongUrl(e.target.value.replace(/\n/g, ""))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        submit()
                      }
                    }}
                    placeholder="https://example.com/some/very/long/url"
                    spellCheck={false}
                    autoComplete="off"
                    autoFocus
                    rows={3}
                    className="min-h-20 resize-none font-mono text-xs leading-relaxed"
                  />
                </Field>

                <Field
                  label="Short link"
                  labelHint={
                    <InfoHint label="What can be an alias">
                      Aliases are letters and numbers, or 1-15 emoji. Only emoji
                      that render in every browser&apos;s address bar are
                      accepted, so flags and multi-person combos are out.
                    </InfoHint>
                  }
                  error={aliasServerMsg}
                  hint={aliasHint}
                >
                  <div className="flex items-center gap-1.5">
                    {showDomains ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Choose a domain"
                            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-input px-2.5 font-mono text-foreground text-xs transition-colors duration-150 hover:bg-accent/40 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                          >
                            {domain}
                            <ChevronDown className="size-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-44">
                          {activeDomains.map((d) => (
                            <DropdownMenuItem
                              key={d}
                              onSelect={() => {
                                optionUse.note("domain", d !== "spoo.me")
                                setDomain(d)
                              }}
                            >
                              <span className="font-mono text-xs">{d}</span>
                              {d === domain && (
                                <Check className="ml-auto size-3.5" />
                              )}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => {
                              setOpen(false)
                              router.push("/dashboard/domains")
                            }}
                          >
                            <Plus className="size-3.5" />
                            <span className="text-xs">Connect a domain</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="flex h-9 shrink-0 items-center rounded-lg border border-input px-2.5 font-mono text-foreground text-xs dark:bg-input/30">
                        {domain}
                      </span>
                    )}
                    <span className="font-mono text-muted-foreground text-xs">
                      /
                    </span>
                    <div className="relative flex-1">
                      <Input
                        value={alias}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\s+/g, "")
                          optionUse.note("alias", v !== "")
                          setAlias(v)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submit()
                        }}
                        placeholder="custom-alias"
                        spellCheck={false}
                        autoComplete="off"
                        className="h-9 pr-8 font-mono text-xs"
                      />
                      <span className="absolute top-1/2 right-2.5 -translate-y-1/2">
                        {aliasVerdict.state === "checking" && (
                          <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" />
                        )}
                        {aliasVerdict.state === "available" && (
                          <Check className="size-3.5 text-live" />
                        )}
                        {(aliasVerdict.state === "problem" ||
                          aliasServerMsg) && (
                          <CircleAlert className="size-3.5 text-destructive" />
                        )}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="size-9 shrink-0"
                          aria-label="Suggest an alias"
                        >
                          <Dices />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            trackUiAction("alias_suggested", "words")
                            optionUse.note("alias", true)
                            setAlias(suggestAlias())
                          }}
                        >
                          Suggest words
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            trackUiAction("alias_suggested", "emoji")
                            optionUse.note("alias", true)
                            setAlias(
                              suggestEmojiAlias(3, generateEmoji ?? undefined)
                            )
                          }}
                        >
                          Suggest emoji
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <EmojiPicker
                      remaining={15 - aliasGraphemes}
                      onPick={(emoji) => {
                        optionUse.note("alias", true)
                        setAlias((a) => a.replace(/\s+/g, "") + emoji)
                      }}
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    label="Expiration"
                    hint="The link stops redirecting after this moment."
                  >
                    <DateTimeField
                      value={expiry}
                      onChange={(v) => {
                        optionUse.note("expiry", v !== "")
                        setExpiry(v)
                      }}
                      placeholder="Never"
                      className="h-9 w-full"
                    />
                    <div className="flex items-center gap-1">
                      {EXPIRY_PRESETS.map(([label, hours]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            optionUse.note("expiry", true)
                            setExpiry(
                              toLocalInputValue(
                                new Date(Date.now() + hours * 3_600_000)
                              )
                            )
                          }}
                          className="h-6 rounded-md border border-border/60 px-2 text-[11px] text-muted-foreground transition-colors duration-150 hover:bg-accent/50 hover:text-foreground"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field
                    label="Max clicks"
                    hint="The link deactivates after this many clicks."
                  >
                    <Input
                      type="number"
                      min={1}
                      value={maxClicks}
                      onChange={(e) => {
                        optionUse.note("max_clicks", e.target.value !== "")
                        setMaxClicks(e.target.value)
                      }}
                      placeholder="Unlimited"
                      className="h-9 font-mono text-xs"
                    />
                  </Field>
                </div>

                <Velvet feature="expired_fallback">
                  <Field
                    label="After expiry"
                    hint="Where visitors land once the link has expired, by time or by click limit."
                    error={fallbackProblem}
                  >
                    <Input
                      type="url"
                      inputMode="url"
                      value={fallbackUrl}
                      onChange={(e) => {
                        optionUse.note(
                          "expired_redirect_url",
                          e.target.value !== ""
                        )
                        setServerFallbackError(null)
                        setFallbackUrl(e.target.value)
                      }}
                      placeholder="Expired page"
                      className="h-9 font-mono text-xs"
                    />
                  </Field>
                </Velvet>
              </TabsContent>

              <TabsContent value="security" className="space-y-5">
                <Field
                  label="Password"
                  hint="Visitors will need this to reach the destination."
                  labelHint={
                    <InfoHint label="How link passwords work">
                      Locks the redirect behind a password prompt. At least 8
                      characters with a letter, a number, and @ or a period.
                    </InfoHint>
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <PasswordInput
                      value={password}
                      onChange={(v) => {
                        optionUse.note("password", v !== "")
                        setPassword(v)
                      }}
                      visible={passwordVisible}
                      onVisibleChange={setPasswordVisible}
                      placeholder="None"
                      className="[&_input]:h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={() => {
                        trackUiAction("password_suggested")
                        optionUse.note("password", true)
                        setPassword(suggestPassword())
                        setPasswordVisible(true)
                      }}
                    >
                      <Dices data-icon="inline-start" />
                      Suggest
                    </Button>
                  </div>
                </Field>

                {/* Same switch group as the edit sheet: bot blocking guards
                    the click budget; private stats guards the numbers. */}
                <div className="divide-y divide-border/60 rounded-xl border border-border/60">
                  <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
                    <span>
                      <span className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                        Block bots
                        <InfoHint label="What blocking bots does">
                          Crawlers and preview bots get an interstitial page;
                          human visitors redirect normally.
                        </InfoHint>
                      </span>
                      <span className="text-muted-foreground/70 text-xs">
                        Crawlers get a preview page instead of the redirect.
                      </span>
                    </span>
                    <Switch
                      checked={blockBots}
                      onCheckedChange={(v) => {
                        optionUse.note("block_bots", v)
                        setBlockBots(v)
                      }}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
                    <span>
                      <span className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                        Private stats
                        <InfoHint label="What private stats does">
                          Turns off the public stats page for this link;
                          analytics stay visible to you alone.
                        </InfoHint>
                      </span>
                      <span className="text-muted-foreground/70 text-xs">
                        Only you can see this link&apos;s analytics.
                      </span>
                    </span>
                    <Switch
                      checked={privateStats}
                      onCheckedChange={(v) => {
                        optionUse.note("private_stats", v)
                        setPrivateStats(v)
                      }}
                    />
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="targeting" className="space-y-5">
                <Velvet feature="geo_targeting">
                  <GeoRulesEditor
                    rules={geoRules}
                    onChange={(v) => {
                      // Set = at least one complete rule; half-filled drafts
                      // aren't a choice yet.
                      optionUse.note(
                        "geo_rules",
                        Object.keys(completeGeoRules(v)).length > 0
                      )
                      setGeoRules(v)
                    }}
                  />
                </Velvet>
                <Velvet feature="ab_testing">
                  <VariantsEditor
                    variants={variants}
                    onChange={(v) => {
                      optionUse.note(
                        "ab_variants",
                        completeVariants(v).length > 0
                      )
                      setVariants(v)
                    }}
                  />
                </Velvet>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-2">
                {/* Fixed-height header row: the live-dot status and reset
                    action swap in place, zero layout shift between mirrored
                    and customized states. */}
                <div className="flex h-7 items-center justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="flex items-center gap-1.5">
                      <SectionLabel>Meta tags</SectionLabel>
                      <InfoHint label="What meta tags do">
                        The social card crawlers see when this link is shared;
                        overrides the destination&apos;s own card.
                      </InfoHint>
                    </span>
                    {metaMirroring && (
                      <span className="label-mono text-[10px] text-muted-foreground/40">
                        fetched from destination
                      </span>
                    )}
                  </div>
                  {metaCustomized && (
                    <button
                      type="button"
                      onClick={() => {
                        optionUse.note("meta_tags", false)
                        setMetaCustomized(false)
                      }}
                      className="text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
                    >
                      Reset to destination
                    </button>
                  )}
                </div>
                <MetaTagsEditor
                  value={displayedMeta}
                  onChange={(v) => {
                    // Any manual edit — typing, clearing, a color pick —
                    // flips customized; auto-fill goes through setMeta only.
                    optionUse.note("meta_tags", Boolean(metaTagsOf(v)))
                    setMeta(v)
                    setMetaCustomized(true)
                  }}
                  domain={domain}
                  alias={alias}
                  preview="side"
                  loading={!metaCustomized && destMeta.isFetching}
                  notice={metaNotice}
                  problem={metaProblem}
                  source={metaCustomized ? metaSource : undefined}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={!canCreate} onClick={submit}>
            {create.isPending && (
              <LoaderCircle className="size-3.5 animate-spin" />
            )}
            Create link
            <Kbd className="ml-1 border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/80">
              <CornerDownLeft className="size-2.5" />
            </Kbd>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
