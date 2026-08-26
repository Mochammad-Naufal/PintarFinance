import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
} from "date-fns"
import { id } from "date-fns/locale"

// ---------------------------------------------------------------------------
// Class utility
// ---------------------------------------------------------------------------

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Currency formatter — IDR (Indonesian Rupiah)
// ---------------------------------------------------------------------------

/**
 * Format a number as Indonesian Rupiah.
 * @example formatCurrency(1500000) → "Rp 1.500.000"
 */
export function formatCurrency(
  amount: number,
  options?: { compact?: boolean; showSign?: boolean }
): string {
  const { compact = false, showSign = false } = options ?? {}

  const absAmount = Math.abs(amount)
  const sign = showSign && amount > 0 ? "+" : amount < 0 ? "-" : ""

  if (compact) {
    if (absAmount >= 1_000_000_000) {
      return `${sign}Rp ${(absAmount / 1_000_000_000).toFixed(1)} M`
    }
    if (absAmount >= 1_000_000) {
      return `${sign}Rp ${(absAmount / 1_000_000).toFixed(1)} jt`
    }
    if (absAmount >= 1_000) {
      return `${sign}Rp ${(absAmount / 1_000).toFixed(0)} rb`
    }
  }

  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount)

  // Intl returns "Rp\u00a0X" — normalise to "Rp X"
  return `${sign}${formatted.replace(/\u00a0/g, " ")}`
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Parse a value to a Date object safely.
 * Accepts Date | string | number.
 */
function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value
  if (typeof value === "number") return new Date(value)
  return parseISO(value)
}

/**
 * Format a date with a custom pattern (date-fns format string).
 * @example formatDate("2024-01-15") → "15 Jan 2024"
 * @example formatDate(new Date(), "MMMM yyyy") → "Januari 2024"
 */
export function formatDate(
  value: Date | string | number,
  fmt = "dd MMM yyyy"
): string {
  const date = toDate(value)
  if (!isValid(date)) return "—"
  return format(date, fmt, { locale: id })
}

/**
 * Format a date as a short month-year string.
 * @example formatMonthYear("2024-01-15") → "Jan 2024"
 */
export function formatMonthYear(value: Date | string | number): string {
  return formatDate(value, "MMM yyyy")
}

/**
 * Format a date as a relative human-readable distance.
 * @example formatRelativeDate(new Date()) → "kurang dari 1 menit yang lalu"
 */
export function formatRelativeDate(
  value: Date | string | number,
  options?: { addSuffix?: boolean }
): string {
  const date = toDate(value)
  if (!isValid(date)) return "—"
  return formatDistanceToNow(date, {
    locale: id,
    addSuffix: options?.addSuffix ?? true,
  })
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Return true if the value is null or undefined.
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined
}
