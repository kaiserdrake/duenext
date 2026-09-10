import type { ItemWithRelations, MonthlySummary } from "@/lib/items";
import MonthInFocus from "@/components/MonthInFocus";

function StatTile({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div
        className={`text-2xl font-medium ${
          danger && value > 0 ? "text-red-600 dark:text-red-400" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function DashboardSummary({
  summary,
  monthStart,
  monthEnd,
  currentWeekStart,
  monthItems,
  currentUserId,
}: {
  summary: MonthlySummary;
  monthStart: string;
  monthEnd: string;
  currentWeekStart: string;
  monthItems: ItemWithRelations[];
  currentUserId: string;
}) {
  return (
    <div className="mb-6 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Due this month" value={summary.dueThisMonth} />
        <StatTile label="Overdue" value={summary.overdue} danger />
        <StatTile label="Completed this month" value={summary.completedThisMonth} />
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
        <MonthInFocus
          monthStart={monthStart}
          monthEnd={monthEnd}
          currentWeekStart={currentWeekStart}
          items={monthItems}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
