"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  CornerDownLeft,
  Dices,
  Gauge,
  Globe,
  KeyRound,
  Link2,
  LoaderCircle,
  Timer,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  checkAlias,
  listCustomDomains,
  shorten,
  SpooApiError,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const OPEN_EVENT = "spoo:new-link"

export function openLinkComposer() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

/** Forgiving URL normalization — missing scheme is fine, never scolded. */
function normalizeUrl(raw: string): string {
  const v = raw.trim()
  if (!v) return v
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

function looksLikeUrl(raw: string): boolean {
  const v = normalizeUrl(raw)
  try {
    const u = new URL(v)
    return u.hostname.includes(".")
  } catch {
    return false
  }
}

/** Password suggester: 3 memorable words + digits, copyable at a glance. */
const WORDS =
  "amber basil cedar delta ember fable garnet hazel indigo juniper koala lumen maple nectar onyx pixel quartz raven sable tundra umber velvet willow zephyr".split(
    " ",
  )
function suggestPassword() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)]
  const num = Math.floor(10 + Math.random() * 89)
  return `${pick()}-${pick()}-${num}`
}

type OptionKey = "alias" | "password" | "expiry" | "maxClicks"

const EXPIRY_PRESETS: Array<[label: string, hours: number]> = [
  ["1 day", 24],
  ["7 days", 168],
  ["30 days", 720],
]

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function LinkComposer() {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [longUrl, setLongUrl] = React.useState("")
  const [expanded, setExpanded] = React.useState<OptionKey | null>(null)

  const [alias, setAlias] = React.useState("")
  const [domain, setDomain] = React.useState("spoo.me")
  const [password, setPassword] = React.useState("")
  const [expiry, setExpiry] = React.useState("")
  const [maxClicks, setMaxClicks] = React.useState("")

  const urlRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  const reset = () => {
    setLongUrl("")
    setAlias("")
    setDomain("spoo.me")
    setPassword("")
    setExpiry("")
    setMaxClicks("")
    setExpanded(null)
  }

  // Active custom domains join the alias control (integrated, ref SPEC §5).
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
    enabled: open,
    staleTime: 60_000,
  })
  const activeDomains = [
    "spoo.me",
    ...(domains.data?.items.filter((d) => d.status === "ACTIVE").map((d) => d.fqdn) ?? []),
  ]

  // Live alias availability, debounced, quiet inline states.
  const [aliasState, setAliasState] = React.useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle")
  React.useEffect(() => {
    if (!alias) return setAliasState("idle")
    if (!/^[a-zA-Z0-9_-]{3,16}$/.test(alias)) return setAliasState("invalid")
    setAliasState("checking")
    const t = setTimeout(() => {
      checkAlias(alias)
        .then((r) => setAliasState(r.available ? "available" : "taken"))
        .catch(() => setAliasState("idle"))
    }, 350)
    return () => clearTimeout(t)
  }, [alias])

  const create = useMutation({
    mutationFn: () =>
      shorten({
        long_url: normalizeUrl(longUrl),
        ...(alias ? { alias } : {}),
        ...(domain !== "spoo.me" ? { domain } : {}),
        ...(password ? { password } : {}),
        ...(expiry
          ? { expire_after: Math.floor(new Date(expiry).getTime() / 1000) }
          : {}),
        ...(maxClicks ? { max_clicks: Number(maxClicks) } : {}),
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      setOpen(false)
      reset()
      const short = created.short_url
      toast.success("Link created", {
        description: short.replace(/^https?:\/\//, ""),
        action: {
          label: "Copy",
          onClick: () => navigator.clipboard.writeText(short),
        },
      })
    },
    onError: (err) => {
      if (err instanceof SpooApiError && err.field === "alias") {
        setExpanded("alias")
        setAliasState("taken")
      } else {
        toast.error(err instanceof Error ? err.message : "Couldn't create the link")
      }
    },
  })

  const canCreate =
    looksLikeUrl(longUrl) &&
    !create.isPending &&
    (alias === "" || aliasState === "available" || aliasState === "checking")

  const submit = () => {
    if (canCreate) create.mutate()
  }

  const normalized = normalizeUrl(longUrl)
  const showNormalization =
    longUrl.trim().length > 3 && normalized !== longUrl.trim() && looksLikeUrl(longUrl)

  const optionChip = (
    key: OptionKey,
    icon: React.ElementType,
    label: string,
    set: boolean,
    summary?: string,
  ) => {
    const Icon = icon
    const active = expanded === key
    return (
      <button
        key={key}
        type="button"
        onClick={() => setExpanded(active ? null : key)}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors duration-150",
          set
            ? "border-brand/30 bg-brand/8 text-foreground"
            : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50 border-dashed",
          active && "border-solid",
        )}
      >
        <Icon className="size-3" strokeWidth={1.75} />
        {set && summary ? summary : label}
      </button>
    )
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/25 dark:bg-black/50" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            urlRef.current?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
          }}
          className="data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-[16%] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 outline-none sm:max-w-xl"
        >
          <DialogPrimitive.Title className="sr-only">New link</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Shorten a URL
          </DialogPrimitive.Description>

          <div className="border-border/60 bg-muted dark:bg-popover overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_48px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_16px_48px_-12px_rgba(0,0,0,0.6)]">
            {/* URL input on the shell */}
            <div className="flex items-center gap-2.5 px-4">
              <Link2 className="text-muted-foreground/70 size-4 shrink-0" strokeWidth={1.75} />
              <input
                ref={urlRef}
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !expanded) submit()
                }}
                placeholder="Paste or type a destination URL…"
                spellCheck={false}
                autoComplete="off"
                className="placeholder:text-muted-foreground/60 h-12 w-full bg-transparent text-sm outline-none"
              />
            </div>

            {/* Inner panel */}
            <div className="border-border/60 bg-popover dark:bg-secondary/50 mx-2 rounded-xl border">
              <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5">
                {optionChip(
                  "alias",
                  Globe,
                  "Alias",
                  alias !== "" || domain !== "spoo.me",
                  `${domain}/${alias || "…"}`,
                )}
                {optionChip("password", KeyRound, "Password", password !== "", "Password set")}
                {optionChip(
                  "expiry",
                  Timer,
                  "Expires",
                  expiry !== "",
                  expiry ? new Date(expiry).toLocaleDateString() : undefined,
                )}
                {optionChip(
                  "maxClicks",
                  Gauge,
                  "Max clicks",
                  maxClicks !== "",
                  maxClicks ? `${maxClicks} clicks` : undefined,
                )}
                {showNormalization && (
                  <span className="text-muted-foreground/70 ml-auto hidden font-mono text-[11px] sm:block">
                    → {normalized.slice(0, 42)}
                    {normalized.length > 42 ? "…" : ""}
                  </span>
                )}
              </div>

              {expanded && (
                <div className="border-border/60 border-t px-3 py-3">
                  {expanded === "alias" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="border-border/60 bg-muted/40 text-foreground hover:bg-accent/60 flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2.5 font-mono text-xs transition-colors duration-150"
                            >
                              {domain}
                              <ChevronDown className="text-muted-foreground size-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {activeDomains.map((d) => (
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
                            placeholder="custom-alias (optional)"
                            spellCheck={false}
                            autoComplete="off"
                            className="h-8 pr-8 font-mono text-xs"
                          />
                          <span className="absolute top-1/2 right-2.5 -translate-y-1/2">
                            {aliasState === "checking" && (
                              <LoaderCircle className="text-muted-foreground size-3.5 animate-spin" />
                            )}
                            {aliasState === "available" && (
                              <Check className="text-live size-3.5" />
                            )}
                            {(aliasState === "taken" || aliasState === "invalid") && (
                              <CircleAlert className="text-destructive size-3.5" />
                            )}
                          </span>
                        </div>
                      </div>
                      <p
                        className={cn(
                          "min-h-4 text-xs",
                          aliasState === "taken" || aliasState === "invalid"
                            ? "text-destructive"
                            : "text-muted-foreground/70",
                        )}
                      >
                        {aliasState === "taken" && "That alias is taken, try another."}
                        {aliasState === "invalid" &&
                          "3–16 characters: letters, numbers, - and _"}
                        {aliasState === "available" && `${domain}/${alias} is available.`}
                        {(aliasState === "idle" || aliasState === "checking") &&
                          "Leave empty for a random alias."}
                      </p>
                    </div>
                  )}

                  {expanded === "password" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password to unlock this link"
                          spellCheck={false}
                          autoComplete="off"
                          className="h-8 font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0"
                          onClick={() => setPassword(suggestPassword())}
                        >
                          <Dices data-icon="inline-start" />
                          Suggest
                        </Button>
                        {password && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Clear password"
                            onClick={() => setPassword("")}
                          >
                            <X />
                          </Button>
                        )}
                      </div>
                      <p className="text-muted-foreground/70 text-xs">
                        Visitors will need this to reach the destination.
                      </p>
                    </div>
                  )}

                  {expanded === "expiry" && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Input
                          type="datetime-local"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="h-8 w-auto font-mono text-xs"
                        />
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
                            className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50 h-8 rounded-lg border px-2.5 text-xs transition-colors duration-150"
                          >
                            {label}
                          </button>
                        ))}
                        {expiry && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Clear expiry"
                            onClick={() => setExpiry("")}
                          >
                            <X />
                          </Button>
                        )}
                      </div>
                      <p className="text-muted-foreground/70 text-xs">
                        The link stops redirecting after this moment.
                      </p>
                    </div>
                  )}

                  {expanded === "maxClicks" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                          placeholder="e.g. 500"
                          className="h-8 w-32 font-mono text-xs"
                        />
                        {maxClicks && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Clear max clicks"
                            onClick={() => setMaxClicks("")}
                          >
                            <X />
                          </Button>
                        )}
                      </div>
                      <p className="text-muted-foreground/70 text-xs">
                        The link deactivates after this many clicks.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer on the shell */}
            <div className="flex h-14 items-center justify-between px-3.5">
              <span className="text-muted-foreground/70 text-xs">
                {create.isPending ? "Creating…" : ""}
              </span>
              <Button size="sm" disabled={!canCreate} onClick={submit}>
                Create link
                <span className="bg-primary-foreground/15 ml-1 flex size-4 items-center justify-center rounded">
                  <CornerDownLeft className="size-2.5" />
                </span>
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
