import { requireUser } from "@/lib/auth-utils";
import { listVisibleItems } from "@/lib/items";
import ItemCard from "@/components/ItemCard";

export default async function ArchivePage() {
  const user = await requireUser();
  const items = await listVisibleItems(user.id, { status: "completed" });

  return (
    <div>
      <h1 className="mb-1 text-lg font-medium">Archive</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Completed items, kept for reference. Open one you own to edit it and set a new
        due date to make it active again.
      </p>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nothing archived yet. Items you mark as done show up here.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items
            .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
            .map((item) => (
              <ItemCard key={item.id} item={item} currentUserId={user.id} />
            ))}
        </div>
      )}
    </div>
  );
}
