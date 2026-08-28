import type { Metadata } from "next"

import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthForm } from "@/components/auth/auth-form"
import { socialCard } from "@/lib/og"

const title = "Sign in"
const description = "Sign in to your spoo.me workspace"

export const metadata: Metadata = {
  title,
  description,
  ...socialCard({
    title,
    description,
    image: "/og/pages/login.jpg",
    alt: "Log in to spoo.me",
  }),
}

export default function LoginPage() {
  return (
    <AuthLayout mode="login">
      <AuthForm mode="login" />
    </AuthLayout>
  )
}
