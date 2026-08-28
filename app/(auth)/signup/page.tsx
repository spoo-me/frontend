import type { Metadata } from "next"

import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthForm } from "@/components/auth/auth-form"
import { socialCard } from "@/lib/og"

const title = "Create your account"
const description = "Start free, upgrade when your links do"

export const metadata: Metadata = {
  title,
  description,
  ...socialCard({
    title,
    description,
    image: "/og/pages/signup.jpg",
    alt: "Create a spoo.me account",
  }),
}

export default function SignupPage() {
  return (
    <AuthLayout mode="signup">
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
