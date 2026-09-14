import { requireUser } from "@/lib/auth-utils";
import { listVisibleItems } from "@/lib/items";
import ArchiveList from "@/components/ArchiveList";

export default async function ArchivePage() {
  const user = await requireUser();
  const items = await listVisibleItems(user.id, { status: "completed" });
  items.sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));

  return (
    <div>
      <h1 className="mb-1 text-lg font-medium">Archive</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Completed items, kept for reference. Open one you own to edit it and set a new
        due date to make it active again, or use it as a template for a new item.
      </p>

      <ArchiveList items={items} currentUserId={user.id} />
    </div>
  );
}
