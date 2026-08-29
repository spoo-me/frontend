import type { Metadata } from "next"

import { AuthLayout } from "@/components/auth/auth-layout"
import { RestorePanel } from "@/components/auth/restore-panel"

export const metadata: Metadata = {
  title: "Restore account",
  description: "Cancel a scheduled account deletion",
  robots: { index: false },
}

export default async function RestoreAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <AuthLayout mode="forgot">
      <RestorePanel token={token ?? null} />
    </AuthLayout>
  )
}
