import { addMonths, differenceInCalendarDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

/** Days out at which an item stops being "due soon" (see `classifyDueDate`). */
export const DUE_SOON_DAYS = 14;

/** Months out beyond which an item is bucketed as "later" rather than "upcoming". */
export const UPCOMING_MONTHS = 6;

export type DueBucket = "overdue" | "soon" | "upcoming" | "later";

/** Buckets a due date relative to `today` for dashboard grouping and card styling. */
export function classifyDueDate(dueDate: Date, today: Date = new Date()): DueBucket {
  const days = differenceInCalendarDays(dueDate, today);
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "soon";
  if (dueDate <= addMonths(today, UPCOMING_MONTHS)) return "upcoming";
  return "later";
}

/** Advances a UTC-midnight date-only value by one recurrence cycle. */
export function advanceDueDate(dueDate: Date, recurrence: "MONTHLY" | "YEARLY"): Date {
  const next = new Date(dueDate);
  if (recurrence === "YEARLY") next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

/**
 * Advances a recurring due date forward until it's on or after `today` -
 * e.g. a birthdate entered as 1985-06-15 resolves to this year's (or next
 * year's) anniversary. A no-op if `dueDate` is already current.
 */
export function rollDueDateForward(dueDate: Date, recurrence: "MONTHLY" | "YEARLY", today: Date): Date {
  let next = dueDate;
  while (next < today) {
    next = advanceDueDate(next, recurrence);
  }
  return next;
}

/** Today's date as YYYY-MM-DD in the given IANA timezone. */
export function getTodayDateString(timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

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

export interface DateRange {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
}

/**
 * Manual UTC-based date math (rather than date-fns's startOfWeek/endOfMonth,
 * which read a Date's *local* calendar fields) - keeps this consistent with
 * how dueDate is already handled everywhere else: as a UTC-midnight
 * date-only value, immune to the server's own local timezone.
 */
function rangeFromTodayString(todayString: string, days: { startOffset: number; endOffset: number }): DateRange {
  const [y, m, d] = todayString.split("-").map(Number);
  const today = new Date(Date.UTC(y, m - 1, d));

  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() + days.startOffset);
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + days.endOffset);

  return {
    start,
    end,
    startLabel: toDateOnlyString(start),
    endLabel: toDateOnlyString(end),
  };
}

/** The current week (Monday to Sunday) containing "today" in `timeZone`. */
export function getWeekRange(timeZone: string): DateRange {
  const todayString = getTodayDateString(timeZone);
  const [y, m, d] = todayString.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return rangeFromTodayString(todayString, {
    startOffset: -daysSinceMonday,
    endOffset: 6 - daysSinceMonday,
  });
}

/** The current calendar month containing "today" in `timeZone`. */
export function getMonthRange(timeZone: string): DateRange {
  const todayString = getTodayDateString(timeZone);
  const [y, m] = todayString.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // day 0 of next month = last day of this month
  return {
    start,
    end,
    startLabel: toDateOnlyString(start),
    endLabel: toDateOnlyString(end),
  };
}
