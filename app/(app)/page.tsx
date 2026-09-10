import Link from "next/link";
import { requireUser } from "@/lib/auth-utils";
import { listVisibleItems, listVisibleItemsDueBetween, getMonthlySummary } from "@/lib/items";
import { getMonthRange, getWeekRange } from "@/lib/dates";
import ItemList from "@/components/ItemList";
import DashboardSummary from "@/components/DashboardSummary";

export default async function DashboardPage() {
  const user = await requireUser();
  const timezone = process.env.REMINDER_TIMEZONE || "UTC";
  const month = getMonthRange(timezone);
  const week = getWeekRange(timezone);

  const [items, summary, monthItems] = await Promise.all([
    listVisibleItems(user.id),
    getMonthlySummary(user.id, timezone),
    listVisibleItemsDueBetween(user.id, month.start, month.end),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-medium">Dashboard</h1>
        <Link
          href="/items/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          New item
        </Link>
      </div>
      <DashboardSummary
        summary={summary}
        monthStart={month.startLabel}
        monthEnd={month.endLabel}
        currentWeekStart={week.startLabel}
        monthItems={monthItems}
        currentUserId={user.id}
      />
      <ItemList items={items} currentUserId={user.id} />
    </div>
  );
}
