"use client"

import { useRouter } from "next/navigation"

import { VerifyPanel } from "@/components/auth/verify-panel"

/**
 * Conditional stop for email-password stragglers who left signup before
 * entering the OTP. The layout forces unverified users here; the normal
 * flow verifies inside the signup page and never sees this route.
 */
export default function VerifyPage() {
  const router = useRouter()
  return <VerifyPanel onDone={() => router.replace("/onboarding/welcome")} />
}
