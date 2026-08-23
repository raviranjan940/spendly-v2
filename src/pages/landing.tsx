import { ArrowRight, CheckCircle2, Sparkles, TrendingUp } from "lucide-react"
import { Navigate } from "react-router-dom"
import { SignedIn, SignedOut, SignUpButton, SignInButton } from "@clerk/clerk-react"

import { Button } from "@/components/ui/button"
import { AppFooter } from "@/components/app-footer"

const FEATURES = [
  {
    title: "Private by design",
    body: "Your ledger is scoped to your account with per-user Firestore rules. Your money data stays yours.",
  },
  {
    title: "Multi-currency",
    body: "Track balances across 9 currencies with locale-aware number formatting.",
  },
  {
    title: "Custom tags",
    body: "Organize income and expenses with categories that match how you actually spend.",
  },
  {
    title: "CSV & PDF reports",
    body: "Export filtered statements as CSV, or generate branded PDF reports with summaries.",
  },
  {
    title: "Instant search",
    body: "Filter by name, tag, type and date range. Sort by date or amount in one click.",
  },
  {
    title: "Zero-friction auth",
    body: "Secure sign-in powered by Clerk — email, social login, or one-tap passkeys.",
  },
]

function HeroMockCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-primary/20 via-transparent to-income/15 blur-2xl" aria-hidden />
      <div className="glass-panel relative rounded-2xl border border-border/70 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Current Balance
          </p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
            <TrendingUp className="size-4 text-primary" />
          </span>
        </div>
        <p className="mt-3 font-display text-4xl font-semibold tabular-nums">
          <span className="mr-1 font-mono text-lg opacity-70">₹</span>
          1,24,850.00
        </p>
        <div className="mt-5 space-y-2.5">
          {[
            { name: "Monthly Salary", tag: "Salary", amount: "+₹85,000", up: true },
            { name: "Grocery shopping", tag: "Food", amount: "−₹4,320", up: false },
            { name: "Electricity bill", tag: "Bills", amount: "−₹1,860", up: false },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className={`size-1.5 rounded-full ${row.up ? "bg-income" : "bg-expense"}`} />
                <div>
                  <p className="text-sm font-medium">{row.name}</p>
                  <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    {row.tag}
                  </p>
                </div>
              </div>
              <span className={`font-mono text-sm font-semibold tabular-nums ${row.up ? "text-income" : "text-expense"}`}>
                {row.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/3 -left-32 h-72 w-72 rounded-full bg-income/8 blur-[100px]" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent/15 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklch, var(--border) 35%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--border) 35%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary glow-primary">
              <TrendingUp className="size-5 text-primary-foreground" />
            </span>
            Spendly<span className="text-primary">.</span>
          </div>
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="gap-2">
                  Get started
                  <ArrowRight className="size-4" />
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-[11px] tracking-[0.16em] text-primary uppercase">
              <Sparkles className="size-3.5" />
              Personal finance, refined
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
              Every rupee,
              <br />
              <span className="text-gradient">beautifully accounted.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
              Spendly is a private, lightning-fast expense tracker. Log income
              and spending, watch your balance update instantly, and export
              statement-grade reports whenever you need them.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="gap-2">
                    Create free account
                    <ArrowRight className="size-4" />
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button size="lg" variant="outline">
                    Sign in
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Free forever", "No credit card", "Your data stays private"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-income" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <HeroMockCard />
        </section>

        {/* Features */}
        <section className="pb-24">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            Built like a statement, not a spreadsheet
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Everything you need to keep a clean personal ledger — nothing you
            don't.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border/70 bg-card/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card"
              >
                <h3 className="font-display font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full bg-primary/15 blur-[90px]" aria-hidden />
            <h2 className="relative font-display text-3xl font-semibold tracking-tight">
              Start your ledger today
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
              It takes less than a minute to make your first entry.
            </p>
            <div className="relative mt-7">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="gap-2">
                    Get started — it's free
                    <ArrowRight className="size-4" />
                  </Button>
                </SignUpButton>
              </SignedOut>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />

      {/* Signed-in users go straight to their ledger */}
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
    </div>
  )
}