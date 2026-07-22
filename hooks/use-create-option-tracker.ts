"use client"

import * as React from "react"

import {
  trackCreateOptionToggled,
  type CreateOption,
  type CreateOptionSurface,
} from "@/lib/analytics"

/**
 * Edge-detects deliberate option use in a create-link form: note() emits
 * create_option_toggled only when an option crosses set <-> cleared, so
 * per-keystroke handlers go quiet after the first character. Ref-backed —
 * no state, no re-renders, fire-and-forget. reset() forgets everything
 * when the form does, so the next fill-in reports fresh.
 */
export function useCreateOptionTracker(surface: CreateOptionSurface) {
  const last = React.useRef<Partial<Record<CreateOption, boolean>>>({})
  return React.useMemo(
    () => ({
      note(option: CreateOption, set: boolean) {
        if ((last.current[option] ?? false) === set) return
        last.current[option] = set
        trackCreateOptionToggled(option, set, surface)
      },
      reset() {
        last.current = {}
      },
    }),
    [surface]
  )
}
