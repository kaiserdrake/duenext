import { classifyDueDate } from "@/lib/dates";
import ItemCard from "@/components/ItemCard";
import type { ItemWithRelations } from "@/lib/items";

function groupItems(items: ItemWithRelations[]) {
  const overdue: ItemWithRelations[] = [];
  const soon: ItemWithRelations[] = [];
  const upcoming: ItemWithRelations[] = [];
  const later: ItemWithRelations[] = [];

  for (const item of items) {
    switch (classifyDueDate(item.dueDate)) {
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

function LaterSection({
  items,
  currentUserId,
}: {
  items: ItemWithRelations[];
  currentUserId: string;
}) {
  if (items.length === 0) return null;
  return (
    <details className="mb-6">
      <summary className="mb-2 cursor-pointer text-sm font-medium text-slate-400 dark:text-slate-500">
        Later ({items.length})
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} currentUserId={currentUserId} />
        ))}
      </div>
    </details>
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

  const { overdue, soon, upcoming, later } = groupItems(items);

  return (
    <div>
      <Section title="Overdue" items={overdue} currentUserId={currentUserId} />
      <Section title="Due soon" items={soon} currentUserId={currentUserId} />
      <Section title="Upcoming" items={upcoming} currentUserId={currentUserId} />
      <LaterSection items={later} currentUserId={currentUserId} />
    </div>
  );
}
