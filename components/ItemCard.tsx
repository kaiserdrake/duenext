import Link from "next/link";
import { format } from "date-fns";
import type { ItemWithRelations } from "@/lib/items";
import {
  DUE_SOON_DAYS,
  calendarDaysUntil,
  computeDueDeadline,
  formatDueTime,
  toDateOnlyString,
} from "@/lib/dates";
import CategoryIcon from "@/components/CategoryIcon";
import DueCountdown from "@/components/DueCountdown";
import { isActionItemCategory } from "@/lib/constants";

/** How far out the countdown ring starts draining; items further out show a full ring. */
const COUNTDOWN_WINDOW_DAYS = 5;

function dueLabel(
  item: ItemWithRelations,
  timeZone: string
): { text: string; tone: "overdue" | "soon" | "normal" | "completed" } {
  if (item.completedAt) {
    return { text: `completed ${format(item.completedAt, "yyyy-MM-dd")}`, tone: "completed" };
  }
  const days = calendarDaysUntil(item.dueDate, timeZone);
  if (computeDueDeadline(item.dueDate, item.dueTime, timeZone) <= new Date()) {
    const n = Math.max(0, -days);
    return { text: n === 0 ? "overdue" : `overdue by ${n} day${n === 1 ? "" : "s"}`, tone: "overdue" };
  }
  if (days === 0) return { text: "due today", tone: "soon" };
  return { text: `due in ${days} day${days === 1 ? "" : "s"}`, tone: days <= DUE_SOON_DAYS ? "soon" : "normal" };
}

const toneClasses: Record<string, string> = {
  overdue: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
  soon: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
  normal: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
  completed: "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50",
};

const toneTextClasses: Record<string, string> = {
  overdue: "text-red-700 dark:text-red-300",
  soon: "text-slate-500 dark:text-slate-400",
  normal: "text-slate-500 dark:text-slate-400",
  completed: "text-slate-400 dark:text-slate-500",
};

export default function ItemCard({
  item,
  currentUserId,
  showTemplateAction = false,
  timeZone = "Asia/Tokyo",
  showCountdown = false,
}: {
  item: ItemWithRelations;
  currentUserId: string;
  showTemplateAction?: boolean;
  /** The zone "today" and the due time are read in (REMINDER_TIMEZONE). */
  timeZone?: string;
  /** Shows a live countdown ring to the due deadline. */
  showCountdown?: boolean;
}) {
  const { text, tone } = dueLabel(item, timeZone);
  const isOwner = item.ownerId === currentUserId;
  // Action Items mirror a task-board card: open the board rather than the
  // item editor, and don't offer them as a template for a new item.
  const editHref = item.taskId ? "/?tab=tasks" : `/items/${item.id}/edit`;
  const templatable = !isActionItemCategory(item.category);

  const visibilityLabel =
    item.visibility === "PRIVATE"
      ? "Only me"
      : item.visibility === "SHARED"
        ? "All users"
        : "Specific users";

  const left = (
    <div className="flex items-center gap-2.5">
      {/* data-sensitive: blurred in the dashboard's privacy mode. */}
      <span className="flex shrink-0" data-sensitive>
        <CategoryIcon category={item.category} className="text-slate-400 dark:text-slate-500" />
      </span>
      <div>
        <div className="text-sm font-medium" data-sensitive>
          {item.title}
        </div>
        <div className={`text-xs ${toneTextClasses[tone]}`}>
          {item.category ? <span data-sensitive>{item.category} · </span> : ""}
          {text} · {toDateOnlyString(item.dueDate)}
          {item.dueTime ? ` at ${formatDueTime(item.dueTime)}` : ""}
          {item.recurrence ? ` · ↻ ${item.recurrence === "YEARLY" ? "yearly" : "monthly"}` : ""}
          {!isOwner && item.owner.name ? <span data-sensitive> · shared by {item.owner.name}</span> : ""}
        </div>
      </div>
    </div>
  );

  // An item without a time is due by the end of its day, not the start of it.
  const countdown =
    showCountdown && !item.completedAt ? (
      <DueCountdown
        dueAt={computeDueDeadline(item.dueDate, item.dueTime, timeZone).toISOString()}
        windowMs={COUNTDOWN_WINDOW_DAYS * 24 * 60 * 60 * 1000}
      />
    ) : null;

  const visibilityBadge = (
    <div className="flex shrink-0 items-center gap-3">
      <span className="text-xs text-slate-400 dark:text-slate-500" title={visibilityLabel}>
        {visibilityLabel}
      </span>
      {countdown}
    </div>
  );

  if (!isOwner) {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 ${toneClasses[tone]}`}>
        {left}
        {visibilityBadge}
      </div>
    );
  }

  if (showTemplateAction && templatable) {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 ${toneClasses[tone]}`}>
        <Link href={editHref} className="min-w-0 flex-1 hover:opacity-80">
          {left}
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          {visibilityBadge}
          <Link
            href={`/items/new?templateId=${item.id}`}
            className="text-xs text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Use as template
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={editHref}
      className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 hover:border-slate-400 dark:hover:border-slate-600 ${toneClasses[tone]}`}
    >
      {left}
      {visibilityBadge}
    </Link>
  );
}
