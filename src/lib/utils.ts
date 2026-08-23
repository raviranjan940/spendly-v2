import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DEFAULT_FILE_NAME = "transactions_report"

/** Strip filesystem-unsafe characters from a user-provided file name. */
export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "").trim()
  return cleaned || DEFAULT_FILE_NAME
}
