import { Heart } from "lucide-react"

export function AppFooter() {
  return (
    <footer className="border-t border-border/50 py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>
          Spendly — your private expense ledger. Built with React, Clerk &
          Firestore.
        </p>
        <p className="flex items-center gap-1.5 font-mono tracking-widest uppercase">
          Crafted with
          <Heart className="size-3 text-expense" fill="currentColor" />
          for clean books
        </p>
      </div>
    </footer>
  )
}
