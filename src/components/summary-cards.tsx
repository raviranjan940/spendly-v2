import {
  PlusCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, getCurrency } from "@/lib/currency"

interface SummaryCardsProps {
  income: number
  expenses: number
  balance: number
  currencyCode: string
  onAddIncome: () => void
  onAddExpense: () => void
  onReset: () => void
}

function MoneyAmount({
  value,
  symbol,
  className,
}: {
  value: number
  symbol: string
  className?: string
}) {
  return (
    <p
      className={`font-display font-semibold tracking-tight tabular-nums ${className ?? ""}`}
    >
      <span className="mr-1 align-middle font-mono text-base font-medium opacity-70">
        {symbol}
      </span>
      {formatNumber(value)}
    </p>
  )
}

function CardIcon({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`flex size-9 items-center justify-center rounded-lg ${className ?? ""}`}
    >
      {children}
    </span>
  )
}

const cardLabelClass =
  "text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-muted-foreground"
const cardHintClass =
  "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80"

export function SummaryCards({
  income,
  expenses,
  balance,
  currencyCode,
  onAddIncome,
  onAddExpense,
  onReset,
}: SummaryCardsProps) {
  const symbol = getCurrency(currencyCode).symbol

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Current balance — statement-stub styling */}
      <Card className="group relative overflow-hidden border-border/60 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5">
        <div className="absolute inset-x-0 top-0 border-t-2 border-dashed border-border/70" aria-hidden />
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100" />
        <CardHeader className="relative flex-row items-center justify-between pt-5 pb-2">
          <CardTitle className={cardLabelClass}>Current Balance</CardTitle>
          <CardIcon className="bg-primary/15">
            <Wallet className="size-5 text-primary" />
          </CardIcon>
        </CardHeader>
        <CardContent className="ledger-ruled relative space-y-3 pt-4 pb-5">
          <MoneyAmount
            value={balance}
            symbol={symbol}
            className={
              balance > 0
                ? "text-income text-4xl"
                : balance < 0
                  ? "text-expense text-4xl"
                  : "text-foreground text-4xl"
            }
          />
          <p className={cardHintClass}>Net income minus expenses</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCw className="size-3.5" />
            Reset Balance
          </Button>
        </CardContent>
      </Card>

      {/* Total income */}
      <Card className="group relative overflow-hidden border-border/60 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-income/10">
        <div className="absolute inset-x-0 top-0 border-t-2 border-dashed border-border/70" aria-hidden />
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-income/10 blur-3xl transition-opacity group-hover:opacity-100" />
        <CardHeader className="relative flex-row items-center justify-between pt-5 pb-2">
          <CardTitle className={cardLabelClass}>Total Income</CardTitle>
          <CardIcon className="bg-income/15">
            <TrendingUp className="size-5 text-income" />
          </CardIcon>
        </CardHeader>
        <CardContent className="ledger-ruled relative space-y-3 pt-4 pb-5">
          <MoneyAmount
            value={income}
            symbol={symbol}
            className="text-income text-4xl"
          />
          <p className={cardHintClass}>Total money received</p>
          <Button variant="income" size="sm" onClick={onAddIncome} className="w-full gap-2">
            <PlusCircle className="size-3.5" />
            Add Income
          </Button>
        </CardContent>
      </Card>

      {/* Total expenses */}
      <Card className="group relative overflow-hidden border-border/60 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-expense/10 sm:col-span-2 lg:col-span-1">
        <div className="absolute inset-x-0 top-0 border-t-2 border-dashed border-border/70" aria-hidden />
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-expense/10 blur-3xl transition-opacity group-hover:opacity-100" />
        <CardHeader className="relative flex-row items-center justify-between pt-5 pb-2">
          <CardTitle className={cardLabelClass}>Total Expenses</CardTitle>
          <CardIcon className="bg-expense/15">
            <TrendingDown className="size-5 text-expense" />
          </CardIcon>
        </CardHeader>
        <CardContent className="ledger-ruled relative space-y-3 pt-4 pb-5">
          <MoneyAmount
            value={expenses}
            symbol={symbol}
            className="text-expense text-4xl"
          />
          <p className={cardHintClass}>Total money spent</p>
          <Button variant="expense" size="sm" onClick={onAddExpense} className="w-full gap-2">
            <PlusCircle className="size-3.5" />
            Add Expense
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
