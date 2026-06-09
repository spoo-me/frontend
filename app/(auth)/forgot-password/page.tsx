import type { Metadata } from "next"

import { AuthLayout } from "@/components/auth/auth-layout"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset code for your spoo.me account",
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout mode="forgot">
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
