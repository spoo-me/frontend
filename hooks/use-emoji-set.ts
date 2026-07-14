"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { getEmojiSet } from "@/lib/api"

/** The accepted emoji set, cached forever (immutable per deploy). Shared by
    the browse picker and the alias fields' offender-naming. */
export function useEmojiSet() {
  return useQuery({
    queryKey: ["emoji-set"],
    queryFn: getEmojiSet,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

/** The accepted canonical base characters as a Set, or null until loaded.
    Used to name unsupported graphemes in the emoji-policy hint. */
export function useAcceptedEmoji(): Set<string> | null {
  const { data } = useEmojiSet()
  return React.useMemo(
    () => (data ? new Set(data.emoji.map((e) => e.c)) : null),
    [data]
  )
}

/** The server's auto-gen pool (emoji-set `gen` entries), or null until loaded.
    Dice suggestions draw from this so they match server auto-gen; before it
    loads, callers fall back to the curated pre-load pool. */
export function useGenerateEmoji(): string[] | null {
  const { data } = useEmojiSet()
  return React.useMemo(
    () => (data ? data.emoji.filter((e) => e.gen).map((e) => e.c) : null),
    [data]
  )
}
