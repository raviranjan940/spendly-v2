import { Navigate, useLocation } from "react-router-dom"
import { SignIn, SignUp, SignedIn } from "@clerk/clerk-react"
import { TrendingUp } from "lucide-react"

interface AuthPageProps {
  mode: "sign-in" | "sign-up"
}

export function AuthPage({ mode }: AuthPageProps) {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard"

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 left-1/2 h-96 w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-income/8 blur-[100px]" />
      </div>

      <a href="/" className="group relative z-10 mb-8 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary glow-primary transition-shadow group-hover:shadow-primary/50">
          <TrendingUp className="size-5 text-primary-foreground" />
        </span>
        <span className="font-display text-2xl font-bold">
          Spendly<span className="text-primary">.</span>
        </span>
      </a>

      <div className="glass-panel relative z-10 w-full max-w-md rounded-2xl border border-border/70 p-6 shadow-2xl sm:p-8">
        {mode === "sign-in" ? (
          <SignIn
            signUpUrl="/sign-up"
            fallbackRedirectUrl={from}
            appearance={{ variables: { colorBackground: "transparent" } }}
          />
        ) : (
          <SignUp
            signInUrl="/sign-in"
            fallbackRedirectUrl={from}
            appearance={{ variables: { colorBackground: "transparent" } }}
          />
        )}
      </div>

      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
    </div>
  )
}
