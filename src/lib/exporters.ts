import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { parse, unparse } from "papaparse"

import { formatAmount } from "@/lib/currency"
import { sanitizeFileName } from "@/lib/utils"
import type { Transaction } from "@/types"

/** Neutralize spreadsheet formula injection. */
export function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? "")
  return /^[=+\-@]/.test(str) ? `'${str}` : str
}

export interface ExportOptions {
  transactions: Transaction[]
  currencyCode: string
  /** Download file name without extension. */
  fileName?: string
}

export function exportCsv({ transactions, fileName }: ExportOptions): void {
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
  link.download = `${sanitizeFileName(fileName ?? "")}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/* ── PDF ──────────────────────────────────────────────────────────── */

type RGB = [number, number, number]

const NAVY: RGB = [17, 24, 39]
const INDIGO: RGB = [79, 70, 229]
const GREEN: RGB = [5, 150, 105]
const RED: RGB = [220, 38, 38]
const GRAY: RGB = [107, 114, 128]
const INK: RGB = [31, 41, 55]
const HAIRLINE: RGB = [229, 231, 235]
const STRIPE: RGB = [249, 250, 251]

export interface PdfLogo {
  dataUrl: string
  /** Natural pixel dimensions */
  width: number
  height: number
  format: "PNG" | "JPEG" | "WEBP"
}

interface PdfOptions extends ExportOptions {
  logo?: PdfLogo | null
}

/** Read a File as a data URL together with its intrinsic size/format. */
export function readImageAsDataUrl(file: File): Promise<PdfLogo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = String(event.target?.result ?? "")
      const img = new Image()
      img.onload = () => {
        const format: PdfLogo["format"] = file.type.includes("png")
          ? "PNG"
          : file.type.includes("webp")
            ? "WEBP"
            : "JPEG"
        resolve({
          dataUrl,
          width: img.naturalWidth || 300,
          height: img.naturalHeight || 100,
          format,
        })
      }
      img.onerror = () => reject(new Error("Failed to decode image"))
      img.src = dataUrl
    }
    reader.onerror = () => reject(new Error("Failed to read image"))
    reader.readAsDataURL(file)
  })
}

function money(doc: jsPDF, text: string, x: number, y: number): void {
  doc.text(text, x, y, { align: "right" })
}

export function exportPdf({
  transactions,
  currencyCode,
  fileName,
  logo,
}: PdfOptions): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2

  /* Totals */
  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  const netTotal = incomeTotal - expenseTotal

  /* ── Header band (page 1) ── */
  const HEADER_H = 36
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageW, HEADER_H, "F")
  doc.setFillColor(...INDIGO)
  doc.rect(0, HEADER_H, pageW, 1.2, "F") // accent underline

  let textX = margin
  if (logo && logo.dataUrl) {
    // Fit the logo into a fixed box, preserving aspect ratio.
    const boxW = 42
    const boxH = 18
    const scale = Math.min(boxW / logo.width, boxH / logo.height)
    const w = logo.width * scale
    const h = logo.height * scale
    try {
      doc.addImage(
        logo.dataUrl,
        logo.format,
        margin,
        (HEADER_H - h) / 2 + 2,
        w,
        h
      )
      textX = margin + w + 8
    } catch {
      // Corrupt/unsupported image — skip silently, keep the report working.
      textX = margin
    }
  } else {
    // Brand mark placeholder: rounded tile with an "S".
    doc.setFillColor(...INDIGO)
    doc.roundedRect(margin, 9, 11, 11, 2.5, 2.5, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text("S", margin + 5.5, 16.8, { align: "center" })
    textX = margin + 15
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(255, 255, 255)
  doc.text("Transactions Report", textX, 15)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(165, 180, 200)
  const generatedOn = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  doc.text(`Spendly  ·  Generated on ${generatedOn}`, textX, 21)

  // Entry counter chip (top-right)
  doc.setFontSize(8.5)
  doc.setTextColor(200, 210, 225)
  doc.text(
    `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`,
    pageW - margin,
    15,
    { align: "right" }
  )

  /* ── Table ── */
  autoTable(doc, {
    startY: HEADER_H + 8,
    margin: { left: margin, right: margin },
    head: [["#", "Name", "Tag", "Type", "Date", "Amount"]],
    body: transactions.map((t, i) => [
      i + 1,
      t.name,
      t.tag,
      t.type === "income" ? "Income" : "Expense",
      t.date,
      formatAmount(t.amount, currencyCode),
    ]),
    theme: "plain",
    styles: {
      fontSize: 9,
      font: "helvetica",
      textColor: INK,
      cellPadding: { top: 2.6, right: 3, bottom: 2.6, left: 3 },
      lineWidth: { bottom: 0.2 },
      lineColor: HAIRLINE,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      lineWidth: 0,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    },
    alternateRowStyles: { fillColor: STRIPE },
    columnStyles: {
      0: { cellWidth: 10, textColor: GRAY },
      4: { cellWidth: 26 },
      5: { halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const isIncome = String(data.cell.raw) === "Income"
        data.cell.styles.textColor = isIncome ? GREEN : RED
        data.cell.styles.fontStyle = "bold"
      }
    },
  })

  /* ── KPI summary cards ── */
  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? HEADER_H + 30
  let y = finalY + 10
  if (y > pageH - 45) {
    doc.addPage()
    y = 20
  }

  const cardGap = 5
  const cardW = (contentW - cardGap * 2) / 3
  const cardH = 20

  const kpi = (
    x: number,
    label: string,
    value: string,
    tint: RGB,
    fg: RGB
  ) => {
    doc.setFillColor(...tint)
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "F")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...fg)
    doc.text(label.toUpperCase(), x + 4, y + 7)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(value, x + 4, y + 14.5)
  }

  kpi(margin, "Total Income", formatAmount(incomeTotal, currencyCode), [236, 253, 245], GREEN)
  kpi(
    margin + cardW + cardGap,
    "Total Expenses",
    formatAmount(expenseTotal, currencyCode),
    [255, 241, 242],
    RED
  )
  kpi(
    margin + (cardW + cardGap) * 2,
    "Net Balance",
    formatAmount(netTotal, currencyCode),
    [238, 242, 255],
    INDIGO
  )

  /* ── Footers on every page ── */
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text("Spendly · Transactions Report", margin, pageH - 8)
    money(doc, `Page ${i} of ${pageCount}`, pageW - margin, pageH - 8)
  }

  doc.save(`${sanitizeFileName(fileName ?? "")}.pdf`)
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
