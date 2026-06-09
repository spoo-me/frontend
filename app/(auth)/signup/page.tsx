import type { Metadata } from "next"

import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start free, upgrade when your links do",
}

export default function SignupPage() {
  return (
    <AuthLayout mode="signup">
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
