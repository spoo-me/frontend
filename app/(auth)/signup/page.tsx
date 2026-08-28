import type { Metadata } from "next"

import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start free, upgrade when your links do",
  openGraph: {
    images: [
      {
        url: "/og/pages/signup.jpg",
        width: 2400,
        height: 1260,
        alt: "Create a spoo.me account",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og/pages/signup.jpg"] },
}

export default function SignupPage() {
  return (
    <AuthLayout mode="signup">
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
