import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import type { ItemWithRelations } from "@/lib/items";
import { DUE_SOON_DAYS, formatDueTime } from "@/lib/dates";
import CategoryIcon from "@/components/CategoryIcon";

function dueLabel(
  dueDate: Date,
  completedAt: Date | null
): { text: string; tone: "overdue" | "soon" | "normal" | "completed" } {
  if (completedAt) {
    return { text: `completed ${format(completedAt, "yyyy-MM-dd")}`, tone: "completed" };
  }
  const days = differenceInCalendarDays(dueDate, new Date());
  if (days < 0) {
    const n = Math.abs(days);
    return { text: `overdue by ${n} day${n === 1 ? "" : "s"}`, tone: "overdue" };
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
}: {
  item: ItemWithRelations;
  currentUserId: string;
}) {
  const { text, tone } = dueLabel(item.dueDate, item.completedAt);
  const isOwner = item.ownerId === currentUserId;

  const visibilityLabel =
    item.visibility === "PRIVATE"
      ? "Only me"
      : item.visibility === "SHARED"
        ? "All users"
        : "Specific users";

  const content = (
    <>
      <div className="flex items-center gap-2.5">
        <CategoryIcon
          category={item.category}
          className="shrink-0 text-slate-400 dark:text-slate-500"
        />
        <div>
          <div className="text-sm font-medium">{item.title}</div>
          <div className={`text-xs ${toneTextClasses[tone]}`}>
            {item.category ? `${item.category} · ` : ""}
            {text} · {format(item.dueDate, "yyyy-MM-dd")}
            {item.dueTime ? ` at ${formatDueTime(item.dueTime)}` : ""}
            {item.recurrence ? ` · ↻ ${item.recurrence === "YEARLY" ? "yearly" : "monthly"}` : ""}
            {!isOwner && item.owner.name ? ` · shared by ${item.owner.name}` : ""}
          </div>
        </div>
      </div>
      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500" title={visibilityLabel}>
        {visibilityLabel}
      </span>
    </>
  );

  if (!isOwner) {
    return (
      <div className={`flex items-center justify-between rounded-md border px-4 py-3 ${toneClasses[tone]}`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/items/${item.id}/edit`}
      className={`flex items-center justify-between rounded-md border px-4 py-3 hover:border-slate-400 dark:hover:border-slate-600 ${toneClasses[tone]}`}
    >
      {content}
    </Link>
  );
}
