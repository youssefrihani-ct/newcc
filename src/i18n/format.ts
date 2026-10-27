import { getLocale } from "./t";

// Dates, numbers and currencies use Intl with the user's locale; default en-GB (DD/MM/YYYY, 24-hour clock).

export function formatDateTime(value: Date | string | number, timeZone?: string): string {
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}

export function formatDate(value: Date | string | number, timeZone?: string): string {
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: "short", ...(timeZone ? { timeZone } : {}) }).format(
    new Date(value),
  );
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}

/** Amounts are integers in the currency's minor unit; precision comes from ISO 4217 via Intl, never assumed to be 2. */
export function formatMoney(minorUnits: number, currency = "GBP"): string {
  const formatter = new Intl.NumberFormat(getLocale(), { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(minorUnits / 10 ** digits);
}
