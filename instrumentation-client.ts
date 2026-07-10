import { initAnalytics } from "@/lib/analytics"

// Runs once in the browser before the app hydrates (Next instrumentation
// hook). No-op unless NEXT_PUBLIC_POSTHOG_KEY is set.
initAnalytics()
