import { fromZonedTime } from "date-fns-tz";

/** Formats a date-only value (assumed UTC-midnight, as Prisma @db.Date fields are) as YYYY-MM-DD. */
export function toDateOnlyString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD string into a UTC-midnight Date, matching Prisma's @db.Date representation. */
export function parseDateOnlyString(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

/** Formats a "HH:mm" (24h) string as a 12-hour label, e.g. "14:05" -> "2:05 PM". */
export function formatDueTime(dueTime: string): string {
  const [hourStr, minute] = dueTime.split(":");
  const hour = Number(hourStr);
  const period = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

/**
 * The exact instant an item is "due", as a real Date. When `dueTime` is set,
 * that's the moment (interpreted in `timeZone`); otherwise the item is
 * treated as due at 00:00 that day in `timeZone`.
 */
export function computeDueInstant(dueDate: Date, dueTime: string | null, timeZone: string): Date {
  const dateString = toDateOnlyString(dueDate);
  const timeString = dueTime ?? "00:00";
  return fromZonedTime(`${dateString}T${timeString}:00`, timeZone);
}
