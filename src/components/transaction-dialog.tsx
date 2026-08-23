import { useEffect, useState } from "react"
import { Loader2, MinusCircle, Pencil, PlusCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { inputToStored, storedToInput, todayInputValue } from "@/lib/dates"
import { getCurrency } from "@/lib/currency"
import type { Transaction, TransactionType } from "@/types"

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided the dialog edits this transaction instead of creating one. */
  transaction?: Transaction | null
  defaultType: TransactionType
  incomeTags: string[]
  expenseTags: string[]
  currencyCode: string
  onSubmit: (values: {
    name: string
    amount: number
    date: string
    tag: string
    type: TransactionType
  }) => Promise<unknown>
}

interface FormState {
  name: string
  amount: string
  date: string
  tag: string
}

const emptyForm: FormState = { name: "", amount: "", date: "", tag: "" }

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  defaultType,
  incomeTags,
  expenseTags,
  currencyCode,
  onSubmit,
}: TransactionDialogProps) {
  const isEditing = Boolean(transaction)
  const [type, setType] = useState<TransactionType>(defaultType)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (!open) return
    if (transaction) {
      setType(transaction.type)
      setForm({
        name: transaction.name,
        amount: String(transaction.amount),
        date: storedToInput(transaction.date),
        tag: transaction.tag,
      })
    } else {
      setType(defaultType)
      setForm({ ...emptyForm, date: todayInputValue() })
    }
  }, [open, transaction, defaultType])

  const tags = type === "income" ? incomeTags : expenseTags

  const updateField = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number.parseFloat(form.amount)
    if (!form.name.trim()) return toast.error("Please enter a name")
    if (!Number.isFinite(amount) || amount < 0)
      return toast.error("Please enter a valid amount")
    if (!form.date) return toast.error("Please pick a date")
    if (!form.tag) return toast.error("Please select a tag")

    setSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        amount,
        date: inputToStored(form.date),
        tag: form.tag,
        type,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const isExpense = type === "expense"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Pencil className="size-5 text-primary" />
                Edit Transaction
              </>
            ) : isExpense ? (
              <>
                <MinusCircle className="size-5 text-expense" />
                Add Expense
              </>
            ) : (
              <>
                <PlusCircle className="size-5 text-income" />
                Add Income
              </>
            )}
          </DialogTitle>
          {!isEditing && (
            <DialogDescription>
              Record a new {isExpense ? "expense" : "income"} entry in your
              ledger.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Type is fixed while editing — change it from the row actions instead. */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  !isExpense
                    ? "border-income/50 bg-income/15 text-income"
                    : "border-border text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                <PlusCircle className="size-4" /> Income
              </button>
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isExpense
                    ? "border-expense/50 bg-expense/15 text-expense"
                    : "border-border text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                <MinusCircle className="size-4" /> Expense
              </button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tx-name">Transaction Name</Label>
            <Input
              id="tx-name"
              placeholder={isExpense ? "e.g. Grocery shopping" : "e.g. Monthly salary"}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-amount">
              Amount
              <span className="font-mono text-xs text-muted-foreground">
                ({getCurrency(currencyCode).code})
              </span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                {getCurrency(currencyCode).symbol}
              </span>
              <Input
                id="tx-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                className="[appearance:textfield] pl-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={form.date}
                max="2100-12-31"
                onChange={(e) => updateField("date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category Tag</Label>
              <Select value={form.tag} onValueChange={(v) => updateField("tag", v)}>
                <SelectTrigger className="w-full" aria-required>
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No tags yet — add in Settings
                    </SelectItem>
                  ) : (
                    tags.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={
                isEditing ? "default" : isExpense ? "expense" : "income"
              }
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save Changes" : isExpense ? "Add Expense" : "Add Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
