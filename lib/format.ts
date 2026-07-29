import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

// Format an ISO date (yyyy-mm-dd) as e.g. "29 thg 7, 2026".
export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "d 'thg' M, yyyy", { locale: vi });
  } catch {
    return iso;
  }
}

// Month + year header, e.g. "Tháng 7 năm 2026".
export function formatMonthYear(iso: string): string {
  try {
    return format(parseISO(iso), "'Tháng' M 'năm' yyyy", { locale: vi });
  } catch {
    return iso;
  }
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}
