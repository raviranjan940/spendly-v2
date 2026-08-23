import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { parse, unparse } from "papaparse"

import { formatAmount, getCurrency } from "@/lib/currency"
import type { Transaction } from "@/types"

/** Neutralize spreadsheet formula injection. */
export function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? "")
  return /^[=+\-@]/.test(str) ? `'${str}` : str
}

export interface ExportOptions {
  transactions: Transaction[]
  currencyCode: string
}

export function exportCsv({ transactions }: ExportOptions): void {
  const csvData = transactions.map((t) => [
    sanitizeCsvCell(t.name),
    t.type,
    t.date,
    sanitizeCsvCell(t.tag),
    t.amount,
  ])
  const csv = unparse({
    fields: ["Name", "Type", "Date", "Tag", "Amount"],
    data: csvData,
  })
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "your_transactions_report.csv"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const INDIGO_RGB: [number, number, number] = [99, 102, 241]

interface PdfOptions extends ExportOptions {
  logoDataUrl?: string | null
}

export function exportPdf({
  transactions,
  currencyCode,
  logoDataUrl,
}: PdfOptions): void {
  const doc = new jsPDF()
  const symbol = getCurrency(currencyCode).symbol

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  let yPosition = logoDataUrl ? 45 : 20

  autoTable(doc, {
    startY: yPosition,
    head: [["Name", "Amount", "Tag", "Type", "Date"]],
    body: transactions.map((t) => [
      t.name,
      formatAmount(t.amount, currencyCode),
      t.tag,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.date,
    ]),
    margin: { top: 10 },
    theme: "striped",
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: "right" } },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(10)
      doc.setTextColor(150)
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      )
    },
  })

  yPosition = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? yPosition) + 20

  if (yPosition > doc.internal.pageSize.height - 60) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(14)
  doc.setTextColor(...INDIGO_RGB)
  doc.setFont("helvetica", "bold")
  doc.text("Financial Summary", 14, yPosition)
  yPosition += 10
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(14, yPosition, doc.internal.pageSize.width - 14, yPosition)
  yPosition += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)

  doc.setTextColor(0, 128, 0)
  doc.text("Total Income:", 14, yPosition)
  doc.text(
    `${symbol}${incomeTotal.toFixed(2)}`,
    doc.internal.pageSize.width - 14,
    yPosition,
    { align: "right" }
  )
  yPosition += 8

  doc.setTextColor(220, 38, 38)
  doc.text("Total Expense:", 14, yPosition)
  doc.text(
    `${symbol}${expenseTotal.toFixed(2)}`,
    doc.internal.pageSize.width - 14,
    yPosition,
    { align: "right" }
  )
  yPosition += 8

  doc.setTextColor(...INDIGO_RGB)
  doc.setFont("helvetica", "bold")
  doc.text("Available Amount:", 14, yPosition)
  doc.text(
    `${symbol}${(incomeTotal - expenseTotal).toFixed(2)}`,
    doc.internal.pageSize.width - 14,
    yPosition,
    { align: "right" }
  )
  doc.setDrawColor(...INDIGO_RGB)
  doc.setLineWidth(0.3)
  doc.rect(10, yPosition - 25, doc.internal.pageSize.width - 20, 35)

  doc.save("your_transactions_report.pdf")
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(String(event.target?.result ?? ""))
    reader.onerror = () => reject(new Error("Failed to read image"))
    reader.readAsDataURL(file)
  })
}

export interface CsvRow {
  Name: string
  Type: string
  Date: string
  Tag: string
  Amount: string | number
}

export function parseCsvFile(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as CsvRow[]),
      error: (error) => reject(error),
    })
  })
}
