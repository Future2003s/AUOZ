import { format } from "date-fns";

/**
 * Format a date value to dd/MM/yyyy. Accepts Date instances or any value
 * that the Date constructor can parse. Returns the provided fallback when
 * the value is missing or invalid.
 */
export function formatDateDDMMYYYY(
  value?: string | number | Date | null,
  fallback = ""
): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, "dd/MM/yyyy");
}


