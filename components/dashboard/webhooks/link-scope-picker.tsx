"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, X } from "lucide-react"

import { listUrls, type UrlListItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

/** Searchable multi-select over the user's links, for endpoint scoping.
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
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className="group inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            {labels.current.get(id) ?? id}
            <X className="size-3 opacity-50 group-hover:opacity-100" />
          </button>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus data-icon="inline-start" />
              {value.length ? "Add link" : "Pick links"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
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
      </div>
    </div>
  )
}
