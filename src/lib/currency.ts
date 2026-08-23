export interface Currency {
  code: string
  symbol: string
  locale: string
  name: string
}

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", locale: "en-IN", name: "Indian Rupee" },
  { code: "USD", symbol: "$", locale: "en-US", name: "US Dollar" },
  { code: "EUR", symbol: "€", locale: "de-DE", name: "Euro" },
  { code: "GBP", symbol: "£", locale: "en-GB", name: "British Pound" },
  { code: "JPY", symbol: "¥", locale: "ja-JP", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", locale: "en-AU", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", locale: "en-CA", name: "Canadian Dollar" },
  { code: "AED", symbol: "د.إ", locale: "ar-AE", name: "UAE Dirham" },
  { code: "SAR", symbol: "ر.س", locale: "ar-SA", name: "Saudi Riyal" },
]

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
}

export function formatNumber(value: number, code = "INR"): string {
  const amount = Number.isFinite(value) ? value : 0
  const locale = getCurrency(code).locale
  try {
    return new Intl.NumberFormat(locale, {
      numberingSystem: "latn",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
}

export function formatAmount(value: number, code = "INR"): string {
  return `${getCurrency(code).symbol}${formatNumber(value, code)}`
}

/** Compact display for summary cards: trims trailing .00 on large values */
export function formatCompact(value: number, code = "INR"): string {
  const currency = getCurrency(code)
  const abs = Math.abs(Number.isFinite(value) ? value : 0)
  if (abs >= 10_000_000) return `${currency.symbol}${(value / 10_000_000).toFixed(2)}Cr`
  if (abs >= 100_000 && currency.code === "INR")
    return `${currency.symbol}${(value / 100_000).toFixed(2)}L`
  if (abs >= 1_000_000) return `${currency.symbol}${(value / 1_000_000).toFixed(2)}M`
  return formatAmount(value, code)
}
