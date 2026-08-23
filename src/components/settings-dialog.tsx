import { useEffect, useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { Coins, Loader2, Save, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useSaveSettings, useUserSettings } from "@/hooks/use-settings"
import { CURRENCIES } from "@/lib/currency"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function TagChips({ tags, tone }: { tags: string[]; tone: "income" | "expense" }) {
  if (tags.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            tone === "expense"
              ? "border-expense/30 bg-expense/10 text-expense"
              : "border-income/30 bg-income/10 text-income"
          }`}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user } = useUser()
  const userId = user?.id
  const settings = useUserSettings(userId)
  const saveSettings = useSaveSettings(userId ?? "")

  const [currencyDraft, setCurrencyDraft] = useState("INR")
  const [expenseDraft, setExpenseDraft] = useState("")
  const [incomeDraft, setIncomeDraft] = useState("")

  // Hydrate drafts whenever the dialog opens with fresh settings.
  useEffect(() => {
    if (!open || !settings.data) return
    setCurrencyDraft(settings.data.currency)
    setExpenseDraft(settings.data.expenseTags.join(", "))
    setIncomeDraft(settings.data.incomeTags.join(", "))
  }, [open, settings.data])

  const handleSave = () => {
    saveSettings.mutate(
      {
        currency: currencyDraft,
        expenseTags: parseTags(expenseDraft),
        incomeTags: parseTags(incomeDraft),
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your preferred currency and transaction category tags.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="settings-currency">
              <Coins className="size-4 text-primary" />
              Currency
            </Label>
            <Select value={currencyDraft} onValueChange={setCurrencyDraft}>
              <SelectTrigger id="settings-currency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono">{c.symbol}</span> {c.code}
                    <span className="text-muted-foreground">— {c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Applies to all balances and transaction amounts.
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* Expense tags */}
          <div className="space-y-2">
            <Label htmlFor="settings-expense-tags">
              <span className="inline-block size-2 rounded-full bg-expense" />
              Expense Tags
            </Label>
            <Input
              id="settings-expense-tags"
              value={expenseDraft}
              onChange={(e) => setExpenseDraft(e.target.value)}
              placeholder="Food, Transport, Bills, Shopping"
            />
            <TagChips tags={parseTags(expenseDraft)} tone="expense" />
          </div>

          {/* Income tags */}
          <div className="space-y-2">
            <Label htmlFor="settings-income-tags">
              <span className="inline-block size-2 rounded-full bg-income" />
              Income Tags
            </Label>
            <Input
              id="settings-income-tags"
              value={incomeDraft}
              onChange={(e) => setIncomeDraft(e.target.value)}
              placeholder="Salary, Freelance, Investment, Gift"
            />
            <TagChips tags={parseTags(incomeDraft)} tone="income" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleSave}
            disabled={saveSettings.isPending}
          >
            {saveSettings.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
