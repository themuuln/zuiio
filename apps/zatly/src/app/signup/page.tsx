"use client"

import { SignupForm } from "@/components/signup-form"
import { MessageCircleCodeIcon } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <MessageCircleCodeIcon className="size-4" />
          </div>
          Zatly
        </a>
        <SignupForm />
      </div>
    </div>
  )
}
