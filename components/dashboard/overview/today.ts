"use client"

import { useQuery } from "@tanstack/react-query"

import { getStats } from "@/lib/api"

export const MINUTE = 60_000
export const DAY = 86_400_000

export function midnight(offsetDays = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return new Date(d.getTime() - offsetDays * DAY)
}

/**
 * Today so far, by link: one request feeds the cards' totals and the
 * top-links list. endDate is read at fetch time so the 60s tick actually
 * advances.
 */
export function useTodayStats() {
  return useQuery({
    queryKey: ["stats", "today"],
    queryFn: () =>
      getStats({
        startDate: midnight(),
        endDate: new Date(),
        groupBy: ["short_code"],
      }),
    refetchInterval: MINUTE,
  })
}
