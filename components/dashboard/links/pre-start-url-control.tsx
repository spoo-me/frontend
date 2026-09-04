"use client"

import * as React from "react"
import { Settings2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { urlProblem } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

/**
 * The pre-start URL, tucked behind a gear on the "Goes live" input: a rare
 * sub-setting of a rare setting, so it earns no row of its own. Inert
 * until a start time exists. The gear reads as ink once a URL is set so
 * the row still tells the truth at a glance.
 */
export function PreStartUrlControl({
  enabled,
  value,
  onChange,
}: {
  enabled: boolean
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const problem = value.trim() ? urlProblem(value) : null
  const isSet = enabled && value.trim() !== ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Where early visitors land"
              disabled={!enabled}
              className={cn(
                "shrink-0",
                isSet ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Settings2 className="size-4" strokeWidth={1.75} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {isSet
            ? "Early visitors are sent elsewhere"
            : "Where early visitors land"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 space-y-2 p-3">
        <Label className="font-medium text-foreground text-xs">
          Early visitors go to
        </Label>
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !problem) {
              e.preventDefault()
              setOpen(false)
            }
          }}
          placeholder="https://"
          spellCheck={false}
          autoFocus
          className="font-mono text-xs"
        />
        {problem ? (
          <p className="text-destructive text-xs">{problem}</p>
        ) : (
          <p className="text-muted-foreground/70 text-xs">
            Anyone who opens the link before it goes live. Blank shows a
            not-yet-live page.
          </p>
        )}
        <div className="flex justify-end gap-1.5 pt-1">
          {value !== "" && (
            <Button type="button" variant="ghost" onClick={() => onChange("")}>
              Clear
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={problem !== null}
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
