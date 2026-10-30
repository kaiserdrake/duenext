import Link from "next/link";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth-utils";
import { listVisibleItems, listVisibleItemsDueBetween, getDashboardSummary, listHiddenItemIds } from "@/lib/items";
import { getMonthRange, getMonthWeeksRange, getTodayDateString, getWeekRange } from "@/lib/dates";
import ItemList from "@/components/ItemList";
import DashboardSummary from "@/components/DashboardSummary";
import DashboardTabs from "@/components/DashboardTabs";
import TaskBoard from "@/components/TaskBoard";
import { isTaskBoardEnabled, listTasks } from "@/lib/tasks";
import { PRIVACY_COOKIE } from "@/lib/privacy";
import PrivacyToggle from "@/components/PrivacyToggle";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const timezone = process.env.REMINDER_TIMEZONE || "Asia/Tokyo";
  const month = getMonthRange(timezone);
  const week = getWeekRange(timezone);
  const focus = getMonthWeeksRange(timezone);

  const [items, summary, monthItems, hiddenItemIds, taskBoardEnabled, { tab }, cookieStore] = await Promise.all([
    listVisibleItems(user.id),
    getDashboardSummary(user.id, timezone),
    listVisibleItemsDueBetween(user.id, focus.start, focus.end),
    listHiddenItemIds(user.id),
    isTaskBoardEnabled(user.id),
    searchParams,
    cookies(),
  ]);
  const privacyMode = cookieStore.get(PRIVACY_COOKIE)?.value === "1";

  const appointmentActions = (
    <div className="flex items-center gap-2">
      <PrivacyToggle enabled={privacyMode} />
      <Link
        href="/items/new"
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        New item
      </Link>
    </div>
  );

  // With the task board beside it, "New item" (and the privacy toggle) sit
  // on the appointments column so it's clearly not for adding tasks.
  const sectionHeading = (title: string, action?: React.ReactNode, className = "flex") => (
    <div className={`mb-3 h-8 items-center justify-between ${className}`}>
      <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h2>
      {action}
    </div>
  );

  const appointments = (
    // In privacy mode, anything marked data-sensitive is blurred (globals.css).
    <div data-privacy={privacyMode ? "on" : undefined}>
      {taskBoardEnabled && sectionHeading("Appointments", appointmentActions)}
      <DashboardSummary
        summary={summary}
        monthStart={month.startLabel}
        monthEnd={month.endLabel}
        focusStart={focus.startLabel}
        focusEnd={focus.endLabel}
        currentWeekStart={week.startLabel}
        today={getTodayDateString(timezone)}
        monthItems={monthItems}
        currentUserId={user.id}
      />
      <ItemList
        items={items}
        currentUserId={user.id}
        timeZone={timezone}
        hiddenItemIds={hiddenItemIds}
        privacyMode={privacyMode}
      />
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-medium">Dashboard</h1>
        {!taskBoardEnabled && appointmentActions}
      </div>
      {taskBoardEnabled ? (
        <DashboardTabs
          initialTab={tab === "tasks" ? "tasks" : "appointments"}
          appointments={appointments}
          tasks={
            // Private cards blur in privacy mode, like appointment details.
            <div data-privacy={privacyMode ? "on" : undefined}>
              {/* On phones the tab already says "Tasks". */}
              {sectionHeading("Tasks", undefined, "hidden lg:flex")}
              <TaskBoard initialTasks={await listTasks(user.id)} />
            </div>
          }
        />
      ) : (
        appointments
      )}
    </div>
  );
}
