import { useState } from "react"
import {
  Download,
  FileText,
  ImageUp,
  Loader2,
  TriangleAlert,
} from "lucide-react"
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
import { sanitizeFileName } from "@/lib/utils"
import type { PdfLogo } from "@/lib/exporters"
import type { Transaction } from "@/types"

// jsPDF/papaparse are heavy — load them only when an export actually runs.
async function loadExporters() {
  return import("@/lib/exporters")
}

export type ExportFormat = "csv" | "pdf"

interface ExportDialogsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  format: ExportFormat
  /** Already-filtered + sorted rows from the ledger. */
  transactions: Transaction[]
  currencyCode: string
}

type ExportScope = "all" | "income" | "expense"

const SCOPES: { value: ExportScope; label: string }[] = [
  { value: "all", label: "All Transactions" },
  { value: "income", label: "Income Only" },
  { value: "expense", label: "Expense Only" },
]

export function ExportDialog({
  open,
  onOpenChange,
  format,
  transactions,
  currencyCode,
}: ExportDialogsProps) {
  const [scope, setScope] = useState<ExportScope>("all")
  const [reportName, setReportName] = useState("Transactions Report")
  const [includeLogo, setIncludeLogo] = useState(false)
  const [logoImage, setLogoImage] = useState<PdfLogo | null>(null)
  const [exporting, setExporting] = useState(false)

  const isPdf = format === "pdf"

  const resetLogoState = () => {
    setIncludeLogo(false)
    setLogoImage(null)
  }

  const handleClose = (next: boolean) => {
    if (!next) resetLogoState()
    onOpenChange(next)
  }

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB")
      return
    }
    const { readImageAsDataUrl } = await loadExporters()
    setLogoImage(await readImageAsDataUrl(file))
  }

  const handleExport = async () => {
    const scoped =
      scope === "all"
        ? transactions
        : transactions.filter((t) => t.type === scope)

    if (scoped.length === 0) {
      toast.error("No transactions match the selected scope")
      return
    }

    if (isPdf && includeLogo && !logoImage) {
      toast.error("Please upload a logo first")
      return
    }

    setExporting(true)
    try {
      const { exportCsv, exportPdf } = await loadExporters()
      if (isPdf) {
        await exportPdf({
          transactions: scoped,
          currencyCode,
          fileName: reportName,
          logo: includeLogo ? logoImage : null,
        })
      } else {
        exportCsv({ transactions: scoped, currencyCode, fileName: reportName })
      }
      toast.success(`${format.toUpperCase()} report exported`)
      handleClose(false)
    } catch (error) {
      console.error(error)
      toast.error(`Failed to export ${format.toUpperCase()}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPdf ? (
              <Download className="size-5 text-primary" />
            ) : (
              <FileText className="size-5 text-primary" />
            )}
            Export {format.toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Choose which transactions to include in your{" "}
            {format.toUpperCase()} report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Report name */}
          <div className="space-y-2">
            <Label htmlFor="export-report-name">Report Name</Label>
            <Input
              id="export-report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Transactions Report"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              Saved as{" "}
              <span className="font-mono">
                {sanitizeFileName(reportName)}.{format}
              </span>
            </p>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <Label>Include</Label>
            <div className="space-y-2">
              {SCOPES.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    scope === value
                      ? "border-primary/60 bg-primary/10"
                      : "border-border hover:bg-secondary/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value={value}
                    checked={scope === value}
                    onChange={() => setScope(value)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {isPdf && (
          <div className="space-y-3 rounded-lg border border-dashed border-border/80 p-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              <span className="text-sm font-medium">Include logo in PDF</span>
            </label>

            {includeLogo && (
              <div className="space-y-3">
                <Label htmlFor="export-logo">Upload Logo (max 2MB)</Label>
                <label
                  htmlFor="export-logo"
                  className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:bg-secondary/60"
                >
                  <ImageUp className="mb-1 size-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Click to upload (JPG, PNG)
                  </span>
                  <input
                    id="export-logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
                {!logoImage && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TriangleAlert className="size-3.5 text-expense" />
                    A logo is required when this option is enabled.
                  </p>
                )}
                {logoImage && (
                  <div className="flex justify-center rounded-lg border border-dashed border-border p-3">
                    <img
                      src={logoImage.dataUrl}
                      alt="Logo preview"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-1">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
