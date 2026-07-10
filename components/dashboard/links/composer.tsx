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

import { trackLinkCreated } from "@/lib/analytics"
import {
  checkAlias,
  fetchUrlMetadata,
  listCustomDomains,
  shorten,
  SpooApiError,
  type CustomDomain,
  type ShortenInput,
} from "@/lib/api"
import { urlProblem } from "@/lib/validation"
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

export function openLinkComposer(opts?: { domain?: string }) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: opts }))
}

/** Suggesters: memorable words, no lookalike characters. */
const WORDS =
  "amber basil cedar delta ember fable garnet hazel indigo juniper koala lumen maple nectar onyx pixel quartz raven sable tundra umber velvet willow zephyr".split(
    " ",
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
const suggestPassword = () =>
  `${pickWord()}.${pickWord()}.${10 + randInt(89)}`
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
          <Label className="text-foreground text-xs font-medium">{label}</Label>
          {labelHint}
        </span>
      ) : (
        <Label className="text-foreground mb-2.5 text-xs font-medium">{label}</Label>
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

  const [longUrl, setLongUrl] = React.useState("")
  const [alias, setAlias] = React.useState("")
  const [domain, setDomain] = React.useState("spoo.me")
  const [password, setPassword] = React.useState("")
  const [passwordVisible, setPasswordVisible] = React.useState(false)
  const [expiry, setExpiry] = React.useState("")
  const [maxClicks, setMaxClicks] = React.useState("")
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
    enabled: open && tab === "metadata" && Boolean(metaFetchUrl),
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
      const preset = (e as CustomEvent<{ domain?: string } | undefined>).detail
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
    setGeoRules([{ country: "", url: "" }])
    setVariants([{ url: "", weight: "" }])
    setMeta(emptyMetaDraft())
    setMetaCustomized(false)
    setBlockBots(false)
    setPrivateStats(false)
    setDebouncedUrl("")
    setServerUrlError(null)
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
    enabled: open,
    staleTime: 60_000,
  })
  const activeDomains = [
    "spoo.me",
    ...(domains.data?.items
      .filter((d) => d.status === "ACTIVE")
      .map((d) => d.fqdn) ?? []),
  ]

  // Live alias availability: idle/invalid/checking derive from the current
  // input; only the server verdict lives in state (keyed to the alias it
  // answered, so stale answers can't label fresh input).
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
    !alias
      ? "idle"
      : !aliasFormatValid
        ? "invalid"
        : verdict?.alias === alias
          ? verdict.available
            ? "available"
            : "taken"
          : "checking"

  const geoPayload = completeGeoRules(geoRules)
  const geoCount = Object.keys(geoPayload).length
  const geoProblem = geoRulesProblem(geoRules)
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
    !metaCustomized && destMeta.isError
      ? metaFetchNotice(destMeta.error)
      : null
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
      const short = created.short_url
      toast.success("Link created", {
        // Machine text reads mono, same as every short link in the app.
        description: (
          <span className="font-mono">{short.replace(/^https?:\/\//, "")}</span>
        ),
        action: {
          label: "Copy",
          onClick: () => navigator.clipboard.writeText(short),
        },
      })
    },
    onError: (err) => {
      if (err instanceof SpooApiError && err.field === "alias") {
        setTab("basic")
        setVerdict({ alias, available: false })
      } else if (err instanceof SpooApiError && err.field === "long_url") {
        setTab("basic")
        setServerUrlError({
          url: normalizeUrl(longUrl),
          message:
            err.message === "URL is blocked"
              ? "That destination is blocked on spoo.me."
              : err.message,
        })
      } else {
        toast.error(
          err instanceof Error ? err.message : "Couldn't create the link",
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
    !metaProblem &&
    (alias === "" || aliasState === "available" || aliasState === "checking")

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

  const basicSet = expiry !== "" || maxClicks !== ""
  const securitySet = password !== "" || blockBots || privateStats
  const targetingSet = geoCount > 0 || variantPayload.length > 0

  /** The dot = this tab holds a value; visible without visiting it. */
  const tabDot = (set: boolean) =>
    set ? (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Padded hit area; the visible dot stays size-1.5. */}
          <span className="-m-1 flex size-3.5 items-center justify-center p-1">
            <span className="bg-brand size-1.5 rounded-full" />
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
    isSet = false,
  ) => (
    <TabsTrigger
      value={value}
      className="data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
    >
      {tab === value && (
        <motion.span
          layoutId="composer-active-tab"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-background dark:border-input dark:bg-input/30 absolute inset-0 rounded-md border border-transparent shadow-sm dark:shadow-none"
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
            setTab(
              (["basic", "security", "targeting", "metadata"] as const)[
                Number(e.key) - 1
              ],
            )
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>New link</DialogTitle>
          <DialogDescription>
            Everything except the destination is optional.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            {tabTrigger("basic", Link2, "Basic", basicSet)}
            {tabTrigger("security", ShieldCheck, "Security", securitySet)}
            {tabTrigger("targeting", Crosshair, "Targeting", targetingSet)}
            {tabTrigger("metadata", Tags, "Metadata", Boolean(metaPayload))}
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
                  hint={
                    aliasState === "taken"
                      ? "That alias is taken, try another."
                      : aliasState === "invalid"
                        ? "3-16 characters: letters, numbers, - and _"
                        : aliasState === "available"
                          ? `${domain}/${alias} is available.`
                          : "Leave the alias empty for a random one."
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Choose a domain"
                          className="shadow-soft border-input text-foreground hover:bg-accent/40 dark:bg-input/30 flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs transition-colors duration-150 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                        >
                          {domain}
                          <ChevronDown className="text-muted-foreground size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-44">
                        {activeDomains.map((d) => (
                          <DropdownMenuItem
                            key={d}
                            onSelect={() => setDomain(d)}
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
                    <span className="text-muted-foreground font-mono text-xs">
                      /
                    </span>
                    <div className="relative flex-1">
                      <Input
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submit()
                        }}
                        placeholder="custom-alias"
                        spellCheck={false}
                        autoComplete="off"
                        className="h-9 pr-8 font-mono text-xs"
                      />
                      <span className="absolute top-1/2 right-2.5 -translate-y-1/2">
                        {aliasState === "checking" && (
                          <LoaderCircle className="text-muted-foreground size-3.5 animate-spin" />
                        )}
                        {aliasState === "available" && (
                          <Check className="text-live size-3.5" />
                        )}
                        {(aliasState === "taken" ||
                          aliasState === "invalid") && (
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

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    label="Expiration"
                    hint="The link stops redirecting after this moment."
                  >
                    <DateTimeField
                      value={expiry}
                      onChange={setExpiry}
                      placeholder="Never"
                      className="h-9 w-full"
                    />
                    <div className="flex items-center gap-1">
                      {EXPIRY_PRESETS.map(([label, hours]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            setExpiry(
                              toLocalInputValue(
                                new Date(Date.now() + hours * 3_600_000),
                              ),
                            )
                          }
                          className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50 h-6 rounded-md border px-2 text-[11px] transition-colors duration-150"
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
                      onChange={(e) => setMaxClicks(e.target.value)}
                      placeholder="Unlimited"
                      className="h-9 font-mono text-xs"
                    />
                  </Field>
                </div>
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
                      onChange={setPassword}
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
                <div className="border-border/60 divide-border/60 divide-y rounded-xl border">
                  <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
                    <span>
                      <span className="text-foreground flex items-center gap-1.5 text-xs font-medium">
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
                      onCheckedChange={setBlockBots}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
                    <span>
                      <span className="text-foreground flex items-center gap-1.5 text-xs font-medium">
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
                      onCheckedChange={setPrivateStats}
                    />
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="targeting" className="space-y-5">
                <GeoRulesEditor rules={geoRules} onChange={setGeoRules} />
                <VariantsEditor variants={variants} onChange={setVariants} />
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
                      <span className="label-mono text-muted-foreground/40 text-[10px]">
                        fetched from destination
                      </span>
                    )}
                  </div>
                  {metaCustomized && (
                    <button
                      type="button"
                      onClick={() => setMetaCustomized(false)}
                      className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4 transition-colors duration-150"
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
            <Kbd className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/80 ml-1">
              <CornerDownLeft className="size-2.5" />
            </Kbd>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
