"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { format } from "date-fns";
import type { ItemWithRelations } from "@/lib/items";
import { toDateOnlyString, parseDateOnlyString } from "@/lib/dates";
import CategoryIcon from "@/components/CategoryIcon";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VISIBLE_DAYS = 7;
// Matches the row's actual rendered height (py-1.5 + text-sm line height),
// so the scroll container shows exactly VISIBLE_DAYS rows without a partial
// row peeking in at the bottom.
const ROW_HEIGHT_PX = 34;

function ResetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

export default function MonthInFocus({
  monthStart,
  monthEnd,
  currentWeekStart,
  today,
  items,
  currentUserId,
}: {
  monthStart: string;
  monthEnd: string;
  currentWeekStart: string;
  today: string;
  items: ItemWithRelations[];
  currentUserId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const start = parseDateOnlyString(monthStart);
  const end = parseDateOnlyString(monthEnd);
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  const itemsByDay = new Map<string, ItemWithRelations[]>();
  for (const item of items) {
    const key = toDateOnlyString(item.dueDate);
    const list = itemsByDay.get(key) ?? [];
    list.push(item);
    itemsByDay.set(key, list);
  }

  const days = Array.from({ length: dayCount }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    const dateString = toDateOnlyString(date);
    return {
      label: DAY_LABELS[date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1],
      date,
      dateString,
      items: itemsByDay.get(dateString) ?? [],
    };
  });

  function scrollToCurrentWeek(smooth: boolean) {
    const container = containerRef.current;
    const target = rowRefs.current[currentWeekStart];
    if (!container || !target) return;
    const offset =
      target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTo({ top: offset, behavior: smooth ? "smooth" : "auto" });
  }

  useEffect(() => {
    scrollToCurrentWeek(false);
    // Only on mount - the point is to default to the current week, not to
    // keep fighting the user's own scrolling on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400">
          This month in focus · {monthStart} – {monthEnd}
        </h2>
        <button
          type="button"
          onClick={() => scrollToCurrentWeek(true)}
          title="Reset to current week"
          aria-label="Reset to current week"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <ResetIcon />
        </button>
      </div>
      <div
        ref={containerRef}
        style={{ maxHeight: ROW_HEIGHT_PX * VISIBLE_DAYS }}
        className="flex flex-col divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800"
      >
        {days.map((day) => {
          const isToday = day.dateString === today;
          return (
            <div
              key={day.dateString}
              ref={(el) => {
                rowRefs.current[day.dateString] = el;
              }}
              className={`flex shrink-0 items-start gap-3 py-1.5 text-sm ${
                isToday ? "bg-slate-50 dark:bg-slate-800/50" : ""
              }`}
            >
              <div
                className={`w-16 shrink-0 text-xs ${
                  isToday
                    ? "font-medium text-slate-900 dark:text-slate-100"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {day.label} {format(day.date, "d")}
              </div>
              <div className="flex flex-1 items-start justify-between gap-2">
                {day.items.length === 0 ? (
                  <span className="text-slate-300 dark:text-slate-600">—</span>
                ) : (
                  <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1">
                    {day.items.map((item) =>
                      item.ownerId === currentUserId ? (
                        <Link
                          key={item.id}
                          href={`/items/${item.id}/edit`}
                          className="flex items-center gap-1.5 hover:underline"
                        >
                          <CategoryIcon
                            category={item.category}
                            className="shrink-0 text-slate-400 dark:text-slate-500"
                          />
                          {item.title}
                        </Link>
                      ) : (
                        <span
                          key={item.id}
                          className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
                        >
                          <CategoryIcon
                            category={item.category}
                            className="shrink-0 text-slate-400 dark:text-slate-500"
                          />
                          {item.title}
                        </span>
                      )
                    )}
                  </div>
                )}
                {isToday && (
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
