import type { Metadata } from "next"

import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Create an account",
  description: "Sign up for spoo.me — free forever",
}

export default function SignupPage() {
  return (
    <AuthLayout>
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
