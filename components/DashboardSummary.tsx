import Link from "next/link";
import type { CategoryCount, DashboardSummaryData, ItemWithRelations } from "@/lib/items";
import MonthInFocus from "@/components/MonthInFocus";

function MonthSummaryTile({ counts }: { counts: CategoryCount[] }) {
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">Month summary</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">{total} due this month</div>
      </div>
      {counts.length === 0 ? (
        <div className="text-sm text-slate-400 dark:text-slate-500">Nothing due this month</div>
      ) : (
        <ul className="flex flex-col gap-1">
          {counts.map(({ category, count }) => (
            <li key={category} className="flex items-center justify-between text-sm">
              <span>{category}</span>
              <span className="font-medium">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RatioTile({
  label,
  parts,
}: {
  label: string;
  parts: { value: number; caption: string }[];
}) {
  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-2xl font-medium">
        {parts.map((part, i) => (
          <span key={part.caption}>
            {i > 0 && <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>}
            {part.value}
          </span>
        ))}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500">
        {parts.map((p) => p.caption).join(" / ")}
      </div>
    </div>
  );
}

function TodoTile({ count }: { count: number }) {
  return (
    <Link
      href="/todos"
      className="rounded-md bg-slate-50 p-3 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
    >
      <div className="text-xs text-slate-500 dark:text-slate-400">To-Do</div>
      <div className="text-2xl font-medium">{count}</div>
      <div className="text-xs text-slate-400 dark:text-slate-500">{count === 1 ? "item" : "items"} open</div>
    </Link>
  );
}

export default function DashboardSummary({
  summary,
  monthStart,
  monthEnd,
  focusStart,
  focusEnd,
  currentWeekStart,
  today,
  monthItems,
  currentUserId,
  openTodoCount,
}: {
  summary: DashboardSummaryData;
  monthStart: string;
  monthEnd: string;
  focusStart: string;
  focusEnd: string;
  currentWeekStart: string;
  today: string;
  monthItems: ItemWithRelations[];
  currentUserId: string;
  openTodoCount: number;
}) {
  return (
    <div className="mb-6 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {/* The summary tiles just add clutter on a phone-sized screen, where
          the calendar below is what people actually come here for. */}
      <div className="hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-4">
        <MonthSummaryTile counts={summary.monthCategoryCounts} />
        <RatioTile
          label="Subscriptions"
          parts={[
            { value: summary.subscriptions.dueThisMonth, caption: "this month" },
            { value: summary.subscriptions.total, caption: "total" },
          ]}
        />
        <RatioTile
          label="Appointments"
          parts={[
            { value: summary.appointments.dueThisWeek, caption: "this week" },
            { value: summary.appointments.dueThisMonth, caption: "this month" },
            { value: summary.appointments.total, caption: "total" },
          ]}
        />
        <TodoTile count={openTodoCount} />
      </div>

      <div className="sm:mt-4 sm:border-t sm:border-slate-200 sm:pt-4 sm:dark:border-slate-800">
        <MonthInFocus
          monthStart={monthStart}
          monthEnd={monthEnd}
          focusStart={focusStart}
          focusEnd={focusEnd}
          currentWeekStart={currentWeekStart}
          today={today}
          items={monthItems}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
