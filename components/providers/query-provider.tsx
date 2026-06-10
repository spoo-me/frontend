"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { SpooApiError } from "@/lib/api"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // The transport layer already handled 401 (refresh + retry once) —
        // a 401 surfacing here is final. Other 4xx won't heal on retry.
        retry: (failureCount, error) => {
          if (error instanceof SpooApiError && error.status < 500) return false
          return failureCount < 2
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  // New client per server render; singleton in the browser (survives
  // React strict-mode double effects and suspense remounts).
  if (typeof window === "undefined") return makeQueryClient()
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
