import { useEffect, useMemo, useRef, useState } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  ArrowUpDown,
  CalendarRange,
  FileText,
  Filter,
  Pencil,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ExportDialog,
  type ExportFormat,
} from "@/components/export-dialog"
import { TransactionDialog } from "@/components/transaction-dialog"
import {
  useBulkAddTransactions,
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions"
import { displayDate, isValidStoredDate, sortTimestamp } from "@/lib/dates"
import { formatAmount } from "@/lib/currency"
import type { NewTransaction, Transaction } from "@/types"
import { toast } from "sonner"

const ROWS_PER_PAGE = 10

type SortKey = "" | "date" | "amount"

interface TransactionsLedgerProps {
  transactions: Transaction[]
  incomeTags: string[]
  expenseTags: string[]
  currencyCode: string
  loading?: boolean
}

export function TransactionsLedger({
  transactions,
  incomeTags,
  expenseTags,
  currencyCode,
  loading = false,
}: TransactionsLedgerProps) {
  const { user } = useUser()
  const userId = user?.id
  const updateMutation = useUpdateTransaction(userId ?? "")
  const deleteMutation = useDeleteTransaction(userId ?? "")
  const bulkAddMutation = useBulkAddTransactions(userId ?? "")

  // Filters / sort / pagination
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("")
  const [selectedTag, setSelectedTag] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Dialogs
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, typeFilter, selectedTag, startDate, endDate])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = transactions.filter((t) => {
      if (query && !t.name.toLowerCase().includes(query)) return false
      if (typeFilter !== "all" && t.type !== typeFilter) return false
      if (selectedTag !== "all" && t.tag !== selectedTag) return false
      const ts = sortTimestamp(t.date)
      if (startDate && ts < sortTimestamp(startDate)) return false
      if (endDate && ts > sortTimestamp(endDate) + 86_399_000) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sortKey === "date") return sortTimestamp(b.date) - sortTimestamp(a.date)
      if (sortKey === "amount") return (b.amount || 0) - (a.amount || 0)
      return sortTimestamp(b.date) - sortTimestamp(a.date)
    })
  }, [transactions, search, typeFilter, selectedTag, startDate, endDate, sortKey])

  const totalPages = Math.max(1, Math.ceil(visible.length / ROWS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = visible.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE
  )

  const allTags = useMemo(
    () => [...new Set([...incomeTags, ...expenseTags])],
    [incomeTags, expenseTags]
  )

  // The ledger only renders inside the signed-in dashboard; bail out otherwise.
  // (Placed after all hooks to keep hook order stable.)
  if (!userId) return null

  /** Visible page numbers with ellipsis, mirroring the classic Spendly pager. */
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | "...")[] = [1]
    if (safePage > 4) pages.push("...")
    const start = Math.max(2, safePage - 1)
    const end = Math.min(totalPages - 1, safePage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (safePage < totalPages - 3) pages.push("...")
    pages.push(totalPages)
    return pages
  }

  const handleCsvImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault()
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const { parseCsvFile } = await import("@/lib/exporters")
      const rows = await parseCsvFile(file)
      const valid: NewTransaction[] = []
      let skipped = 0

      for (const row of rows) {
        const name = String(row.Name ?? "").trim()
        const type =
          row.Type === "income" || row.Type === "expense" ? row.Type : null
        const date = String(row.Date ?? "").trim()
        const amount = Number.parseFloat(String(row.Amount))
        const tag = String(row.Tag ?? "").trim()

        if (!name || !type || !isValidStoredDate(date) || !tag || !Number.isFinite(amount) || amount < 0) {
          skipped++
          continue
        }
        valid.push({ name, type, date, tag, amount })
      }

      if (valid.length === 0 && skipped === 0) {
        toast.error("No rows found in CSV")
        return
      }
      if (valid.length === 0) {
        toast.error("No valid rows found — check the column headers")
        return
      }
      bulkAddMutation.mutate(valid)
    } catch (error) {
      console.error(error)
      toast.error("Error parsing CSV file")
    }
  }

  const handleExportClick = (format: ExportFormat) => {
    setExportFormat(format)
    setExportOpen(true)
  }

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== "all" ||
    selectedTag !== "all" ||
    Boolean(startDate || endDate)

  return (
    <Card className="overflow-hidden border-border/60 shadow-lg">
      {/* ── Controls ── */}
      <CardHeader className="space-y-4 border-b border-border/70 pb-4">
        <div className="flex items-center justify-between pt-5">
          <CardTitle className="font-display text-xl">The Ledger</CardTitle>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            {visible.length} transaction{visible.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search & filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              placeholder="Search by name..."
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-full sm:w-44">
              <Tag className="size-4 opacity-60" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="size-4 opacity-60" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort & date range */}
        <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
          <div className="flex gap-1 rounded-lg border border-border bg-secondary/40 p-1">
            {(
              [
                { key: "", label: "Latest" },
                { key: "date", label: "By Date" },
                { key: "amount", label: "By Amount" },
              ] as { key: SortKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key || "none"}
                onClick={() => setSortKey(key)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                  sortKey === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowUpDown className="size-3" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <CalendarRange className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
              <CalendarRange className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
                className="pl-10"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                }}
                aria-label="Clear dates"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Export & import */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportClick("csv")}
            className="gap-2"
          >
            <FileText className="size-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportClick("pdf")}
            className="gap-2"
          >
            <FileText className="size-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkAddMutation.isPending}
            className="gap-2"
          >
            <Upload className="size-4" />
            {bulkAddMutation.isPending ? "Importing…" : "Import CSV"}
          </Button>
          <input
            ref={fileInputRef}
            onChange={handleCsvImport}
            type="file"
            accept=".csv"
            className="hidden"
          />
        </div>
      </CardHeader>

      {/* ── Table ── */}
      <CardContent className="p-0 pb-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <span className="border-primary border-t-primary-foreground size-8 animate-spin rounded-full border-3 border-transparent" />
            <p className="text-sm">Loading your ledger…</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <FileText className="size-12 opacity-20" />
            <p className="text-sm font-medium">
              {hasActiveFilters
                ? "No transactions match your filters"
                : "Your ledger is empty"}
            </p>
            <p className="text-xs">
              {hasActiveFilters
                ? "Try adjusting or clearing the filters above"
                : "Add your first income or expense to get started"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((transaction) => {
                const isIncome = transaction.type === "income"
                return (
                  <TableRow key={transaction.id} className="group">
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {transaction.name}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono tabular-nums font-semibold ${
                        isIncome ? "text-income" : "text-expense"
                      }`}
                    >
                      {isIncome ? "+" : "−"}
                      {formatAmount(transaction.amount, currencyCode)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border border-border bg-secondary/60 px-2 py-0.5 font-mono text-[11px] tracking-wide text-secondary-foreground uppercase">
                        {transaction.tag}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isIncome ? "income" : "expense"}>
                        {isIncome ? "Income" : "Expense"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                      {displayDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditing(transaction)
                            setEditOpen(true)
                          }}
                          aria-label={`Edit ${transaction.name}`}
                          title="Edit transaction"
                          className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(transaction)}
                          aria-label={`Delete ${transaction.name}`}
                          title="Delete transaction"
                          className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!loading && visible.length > ROWS_PER_PAGE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border/70 px-4 py-4 sm:flex-row">
            <p className="order-2 text-xs text-muted-foreground sm:order-1">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(safePage - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(safePage * ROWS_PER_PAGE, visible.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{visible.length}</span>
            </p>
            <nav
              aria-label="Pagination"
              className="order-1 flex items-center gap-1 sm:order-2"
            >
              <PagerButton
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </PagerButton>
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 text-xs text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === safePage ? "page" : undefined}
                    className={`h-8 min-w-8 cursor-pointer rounded-md px-2 font-mono text-xs transition-colors ${
                      page === safePage
                        ? "bg-primary font-semibold text-primary-foreground glow-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <PagerButton
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </PagerButton>
            </nav>
          </div>
        )}
      </CardContent>

      {/* Edit dialog */}
      <TransactionDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditing(null)
        }}
        transaction={editing}
        defaultType={editing?.type ?? "expense"}
        incomeTags={incomeTags}
        expenseTags={expenseTags}
        currencyCode={currencyCode}
        onSubmit={(values) =>
          editing
            ? updateMutation.mutateAsync({ ...values, id: editing.id })
            : Promise.resolve()
        }
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">“{deleting?.name}”</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (deleting) {
                  deleteMutation.mutate(deleting.id)
                  setDeleting(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              <Trash2 className="size-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        format={exportFormat}
        transactions={visible}
        currencyCode={currencyCode}
      />
    </Card>
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cnPager(disabled)}
    >
      {children}
    </button>
  )
}

function cnPager(disabled?: boolean): string {
  return [
    "h-8 cursor-pointer rounded-md px-2.5 font-mono text-xs transition-colors",
    disabled
      ? "pointer-events-none opacity-40"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  ].join(" ")
}
