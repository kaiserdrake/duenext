import { classifyDueDate } from "@/lib/dates";
import ItemCard from "@/components/ItemCard";
import OverdueSection from "@/components/OverdueSection";
import type { ItemWithRelations } from "@/lib/items";

function groupItems(items: ItemWithRelations[], timeZone: string) {
  const overdue: ItemWithRelations[] = [];
  const soon: ItemWithRelations[] = [];
  const upcoming: ItemWithRelations[] = [];
  const later: ItemWithRelations[] = [];

  for (const item of items) {
    switch (classifyDueDate(item.dueDate, item.dueTime, timeZone)) {
      case "overdue":
        overdue.push(item);
        break;
      case "soon":
        soon.push(item);
        break;
      case "upcoming":
        upcoming.push(item);
        break;
      case "later":
        later.push(item);
        break;
    }
  }

  return { overdue, soon, upcoming, later };
}

function Section({
  title,
  items,
  currentUserId,
  timeZone,
  showCountdown = false,
}: {
  title: string;
  items: ItemWithRelations[];
  currentUserId: string;
  timeZone: string;
  showCountdown?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h2>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            currentUserId={currentUserId}
            timeZone={timeZone}
            showCountdown={showCountdown}
          />
        ))}
      </div>
    </div>
  );
}

function LaterSection({
  items,
  currentUserId,
  timeZone,
}: {
  items: ItemWithRelations[];
  currentUserId: string;
  timeZone: string;
}) {
  if (items.length === 0) return null;
  return (
    <details className="mb-6">
      <summary className="mb-2 cursor-pointer text-sm font-medium text-slate-400 dark:text-slate-500">
        Later ({items.length})
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} currentUserId={currentUserId} timeZone={timeZone} />
        ))}
      </div>
    </details>
  );
}

export default function ItemList({
  items,
  currentUserId,
  timeZone,
  hiddenItemIds = [],
  privacyMode = false,
}: {
  items: ItemWithRelations[];
  currentUserId: string;
  timeZone: string;
  /** Overdue items the user has hidden; they sit behind a "Show hidden" toggle. */
  hiddenItemIds?: string[];
  /** Show only items due soon (blurred by the page); everything else is summarised as a count. */
  privacyMode?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No items yet. Create one to start tracking expiration and due dates.
      </div>
    );
  }

  const { overdue, soon, upcoming, later } = groupItems(items, timeZone);
  const hidden = new Set(hiddenItemIds);

  if (privacyMode) {
    const concealed = upcoming.length + later.length + overdue.filter((item) => !hidden.has(item.id)).length;
    return (
      <div>
        <Section title="Due soon" items={soon} currentUserId={currentUserId} timeZone={timeZone} showCountdown />
        <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Privacy mode is on
          {concealed > 0 ? `: ${concealed} item${concealed === 1 ? "" : "s"} not due soon ${concealed === 1 ? "is" : "are"} hidden.` : "."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Section title="Due soon" items={soon} currentUserId={currentUserId} timeZone={timeZone} showCountdown />
      <Section title="Upcoming" items={upcoming} currentUserId={currentUserId} timeZone={timeZone} />
      {/* Below Upcoming on purpose: overdue items are often ones there's
          nothing left to do about, so they shouldn't lead the page. */}
      <OverdueSection
        visibleItems={overdue.filter((item) => !hidden.has(item.id))}
        hiddenItems={overdue.filter((item) => hidden.has(item.id))}
        currentUserId={currentUserId}
        timeZone={timeZone}
      />
      <LaterSection items={later} currentUserId={currentUserId} timeZone={timeZone} />
    </div>
  );
}
