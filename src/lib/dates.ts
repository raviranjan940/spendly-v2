/**
 * Dates are stored as DD-MM-YYYY strings in Firestore for compatibility
 * with the original Spendly dataset. These helpers parse/format them and
 * convert to/from the ISO strings used by <input type="date">.
 */

const STORAGE_FORMAT = "DD-MM-YYYY"
const INPUT_FORMAT = "YYYY-MM-DD"

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

/** Parse a stored date ("DD-MM-YYYY") or ISO ("YYYY-MM-DD") into a Date (local). */
export function parseDate(value: string): Date | null {
  if (!value) return null
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  }
  const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value)
  if (dmyMatch) {
    return new Date(
      Number(dmyMatch[3]),
      Number(dmyMatch[2]) - 1,
      Number(dmyMatch[1])
    )
  }
  return null
}

export function isValidStoredDate(value: string): boolean {
  return parseDate(value) !== null
}

/** Format a Date into the storage format (DD-MM-YYYY). */
export function toStorageFormat(date: Date): string {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`
}

/** Format a Date into the input format (YYYY-MM-DD). */
export function toInputFormat(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Convert a stored date string into an <input type="date"> value. */
export function storedToInput(value: string): string {
  const d = parseDate(value)
  return d ? toInputFormat(d) : ""
}

/** Convert an <input type="date"> value into the storage format. */
export function inputToStored(value: string): string {
  const d = parseDate(value)
  return d ? toStorageFormat(d) : ""
}

export function todayInputValue(): string {
  return toInputFormat(new Date())
}

/** Timestamp used purely for sorting comparisons (local midnight). */
export function sortTimestamp(value: string): number {
  const d = parseDate(value)
  return d ? d.getTime() : 0
}

/** Human-friendly display, e.g. "12 Aug 2025". */
export function displayDate(value: string): string {
  const d = parseDate(value)
  if (!d || Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export { STORAGE_FORMAT, INPUT_FORMAT }
