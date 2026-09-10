import { differenceInCalendarDays } from "date-fns";
import ItemCard from "@/components/ItemCard";
import type { ItemWithRelations } from "@/lib/items";

function groupItems(items: ItemWithRelations[]) {
  const overdue: ItemWithRelations[] = [];
  const soon: ItemWithRelations[] = [];
  const upcoming: ItemWithRelations[] = [];

  for (const item of items) {
    const days = differenceInCalendarDays(item.dueDate, new Date());
    if (days < 0) overdue.push(item);
    else if (days <= 14) soon.push(item);
    else upcoming.push(item);
  }

  return { overdue, soon, upcoming };
}

function Section({
  title,
  items,
  currentUserId,
}: {
  title: string;
  items: ItemWithRelations[];
  currentUserId: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h2>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} currentUserId={currentUserId} />
        ))}
      </div>
    </div>
  );
}

export default function ItemList({
  items,
  currentUserId,
}: {
  items: ItemWithRelations[];
  currentUserId: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No items yet. Create one to start tracking expiration and due dates.
      </div>
    );
  }

  const { overdue, soon, upcoming } = groupItems(items);

  return (
    <div>
      <Section title="Overdue" items={overdue} currentUserId={currentUserId} />
      <Section title="Due soon" items={soon} currentUserId={currentUserId} />
      <Section title="Upcoming" items={upcoming} currentUserId={currentUserId} />
    </div>
  );
}
