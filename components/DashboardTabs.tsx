"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { TaskDTO } from "@/lib/taskTimer";
import { useTaskClock } from "@/components/TaskTimer";

export type DashboardTab = "appointments" | "tasks";

// Lets the task board (rendered as a child) report its running task up to
// the tab bar, so the Tasks tab can show the timer while you're on the other one.
const ActiveTaskContext = createContext<((task: TaskDTO | null) => void) | null>(null);

export function useReportActiveTask() {
  return useContext(ActiveTaskContext);
}

function TabBadge({ task }: { task: TaskDTO | null }) {
  const clock = useTaskClock(task);
  if (!task || !clock.display) return null;
  if (clock.expired) {
    return (
      <span className="ml-1.5 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 motion-safe:animate-ping" />
        Time&apos;s up
      </span>
    );
  }
  return <span className="ml-1.5 tabular-nums text-slate-500 dark:text-slate-400">{clock.display}</span>;
}

/**
 * Appointments and the task board: side by side on wide screens, as two
 * tabs on narrow ones. Both panels stay mounted either way, so switching
 * tabs never resets the board (or its timer).
 */
export default function DashboardTabs({
  initialTab,
  appointments,
  tasks,
}: {
  initialTab: DashboardTab;
  appointments: ReactNode;
  tasks: ReactNode;
}) {
  const [tab, setTab] = useState<DashboardTab>(initialTab);
  const [activeTask, setActiveTask] = useState<TaskDTO | null>(null);

  function select(next: DashboardTab) {
    setTab(next);
    // Keep the choice in the URL so a reload lands on the same tab.
    const url = new URL(window.location.href);
    if (next === "tasks") url.searchParams.set("tab", "tasks");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  }

  const tabClass = (t: DashboardTab) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm ${
      tab === t
        ? "bg-white font-medium text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    }`;

  return (
    <ActiveTaskContext.Provider value={setActiveTask}>
      <div role="tablist" className="mb-4 flex gap-1 rounded-lg bg-slate-200/70 p-1 lg:hidden dark:bg-slate-900">
        <button type="button" role="tab" aria-selected={tab === "appointments"} onClick={() => select("appointments")} className={tabClass("appointments")}>
          Appointments
        </button>
        <button type="button" role="tab" aria-selected={tab === "tasks"} onClick={() => select("tasks")} className={tabClass("tasks")}>
          Tasks
          <TabBadge task={activeTask} />
        </button>
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-6">
        <div className={tab === "appointments" ? "" : "hidden lg:block"}>{appointments}</div>
        <div
          className={`lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto ${
            tab === "tasks" ? "" : "hidden lg:block"
          }`}
        >
          {tasks}
        </div>
      </div>
    </ActiveTaskContext.Provider>
  );
}
