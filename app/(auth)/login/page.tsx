import type { Metadata } from "next"

import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your spoo.me workspace",
  openGraph: { images: [{ url: "/og/pages/login.jpg", width: 2400, height: 1260, alt: "Log in to spoo.me" }] },
  twitter: { card: "summary_large_image", images: ["/og/pages/login.jpg"] },
}

export default function LoginPage() {
  return (
    <AuthLayout mode="login">
      <AuthForm mode="login" />
    </AuthLayout>
  )
}
