"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"

import { cn } from "@/lib/utils"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & { containerClassName?: string }) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & { index: number }) {
  const ctx = React.useContext(OTPInputContext)
  const slot = ctx?.slots[index]

  return (
    <div
      data-slot="input-otp-slot"
      data-active={slot?.isActive || undefined}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-lg border border-input bg-background font-mono text-lg shadow-soft transition-all",
        "data-active:z-10 data-active:border-ring data-active:ring-2 data-active:ring-ring/30",
        "aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    >
      {slot?.char}
      {slot?.hasFakeCaret && (
        <span
          aria-hidden
          className="pointer-events-none absolute h-5 w-px animate-blink-cursor bg-foreground"
        />
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      className="h-px w-2.5 bg-border"
      {...props}
    />
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
