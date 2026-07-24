"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, X } from "lucide-react"

import { listUrls, type UrlListItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function labelOf(link: UrlListItem) {
  return `${link.domain ?? "spoo.me"}/${link.alias ?? link.id}`
}

/** Scope as a field: resting state is "All links"; picking links narrows
    the endpoint to them, shown as removable chips inside the field.
    Selected ids keep their labels in a local cache so chips stay readable
    after the search text moves on. */
export function LinkScopePicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  const labels = React.useRef(new Map<string, string>())

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 200)
    return () => clearTimeout(t)
  }, [search])

  const links = useQuery({
    queryKey: ["urls", "scope-picker", debounced],
    queryFn: () =>
      listUrls({
        pageSize: 20,
        ...(debounced ? { filter: { search: debounced } } : {}),
      }),
    enabled: open,
  })

  const items = links.data?.items ?? []
  for (const link of items) labels.current.set(link.id, labelOf(link))

  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-left shadow-soft outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          )}
        >
          {value.length ? (
            value.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {labels.current.get(id) ?? id}
                {/* span, not button: buttons don't nest */}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label="Remove link"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(id)
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="cursor-pointer opacity-50 transition-opacity duration-150 hover:opacity-100"
                >
                  <X className="size-3" />
                </span>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">All links</span>
          )}
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search links…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {links.isFetching ? "Searching…" : "No links found"}
            </CommandEmpty>
            {items.map((link) => (
              <CommandItem
                key={link.id}
                value={link.id}
                onSelect={() => toggle(link.id)}
                className="gap-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full transition-opacity duration-150",
                    value.includes(link.id)
                      ? "bg-foreground opacity-80"
                      : "opacity-0"
                  )}
                />
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {labelOf(link)}
                </span>
                {link.long_url && (
                  <span className="max-w-28 truncate text-muted-foreground/60 text-xs">
                    {(() => {
                      try {
                        return new URL(link.long_url).host
                      } catch {
                        return link.long_url
                      }
                    })()}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
