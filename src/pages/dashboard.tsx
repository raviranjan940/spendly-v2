import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { Navigate } from "react-router-dom"

import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { ResetBalanceDialog } from "@/components/reset-balance-dialog"
import { SummaryCards } from "@/components/summary-cards"
import { TransactionDialog } from "@/components/transaction-dialog"
import { TransactionsLedger } from "@/components/transactions-ledger"
import { UserDocSync } from "@/components/user-doc-sync"
import {
  useAddTransaction,
  useResetTransactions,
  useTransactions,
} from "@/hooks/use-transactions"
import { useUserSettings } from "@/hooks/use-settings"
import type { TransactionType } from "@/types"

export function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser()
  const userId = user?.id
  const transactionsQuery = useTransactions(userId)
  const settingsQuery = useUserSettings(userId)
  const addMutation = useAddTransaction(userId ?? "")
  const resetMutation = useResetTransactions(userId ?? "")

  const [addType, setAddType] = useState<TransactionType>("expense")
  const [addOpen, setAddOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  if (!isLoaded) return <DashboardSkeleton />
  if (!isSignedIn) return <Navigate to="/" replace />

  const transactions = transactionsQuery.data ?? []
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount
      else acc.expenses += t.amount
      return acc
    },
    { income: 0, expenses: 0, balance: 0 }
  )
  totals.balance = totals.income - totals.expenses

  const currencyCode = settingsQuery.data?.currency ?? "INR"
  const incomeTags = settingsQuery.data?.incomeTags ?? []
  const expenseTags = settingsQuery.data?.expenseTags ?? []

  return (
    <div className="relative flex min-h-dvh flex-col">
      <UserDocSync />
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl grow px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary cards */}
        <SummaryCards
          income={totals.income}
          expenses={totals.expenses}
          balance={totals.balance}
          currencyCode={currencyCode}
          onAddIncome={() => {
            setAddType("income")
            setAddOpen(true)
          }}
          onAddExpense={() => {
            setAddType("expense")
            setAddOpen(true)
          }}
          onReset={() => setResetOpen(true)}
        />

        {/* Ledger */}
        <section className="mt-6">
          <TransactionsLedger
            transactions={transactions}
            incomeTags={incomeTags}
            expenseTags={expenseTags}
            currencyCode={currencyCode}
            loading={transactionsQuery.isLoading}
          />
        </section>
      </main>

      <AppFooter />

      {/* Add transaction (income/expense) */}
      <TransactionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultType={addType}
        incomeTags={incomeTags}
        expenseTags={expenseTags}
        currencyCode={currencyCode}
        onSubmit={(values) => addMutation.mutateAsync(values)}
      />

      {/* Reset confirmation */}
      <ResetBalanceDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        pending={resetMutation.isPending}
        transactionCount={transactions.length}
        onConfirm={() => resetMutation.mutate(undefined, {
          onSuccess: () => setResetOpen(false),
        })}
      />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span className="size-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Preparing your ledger…
        </p>
      </div>
    </div>
  )
}
