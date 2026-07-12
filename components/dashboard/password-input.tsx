"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * Password field with visibility toggle. Typed passwords stay masked;
 * a suggested password should be revealed by the parent (setVisible(true))
 * so the user can read what they were given.
 */
export function PasswordInput({
  value,
  onChange,
  visible,
  onVisibleChange,
  placeholder,
  readOnly,
  className,
}: {
  value: string
  onChange?: (value: string) => void
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
}) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="new-password"
        className="pr-9 font-mono text-xs"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => onVisibleChange(!visible)}
        className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-150 hover:text-foreground"
      >
        {visible ? (
          <EyeOff className="size-3.5" strokeWidth={1.75} />
        ) : (
          <Eye className="size-3.5" strokeWidth={1.75} />
        )}
      </button>
    </div>
  )
}
