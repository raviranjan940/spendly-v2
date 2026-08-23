export type TransactionType = "income" | "expense"

export interface Transaction {
  id: string
  name: string
  amount: number
  /** Stored as DD-MM-YYYY */
  date: string
  tag: string
  type: TransactionType
}

export type NewTransaction = Omit<Transaction, "id">

export interface UserSettings {
  expenseTags: string[]
  incomeTags: string[]
  currency: string
}

export interface Totals {
  income: number
  expenses: number
  balance: number
}
