import Link from "next/link";
import { requireUser } from "@/lib/auth-utils";
import { listVisibleItems } from "@/lib/items";
import ItemList from "@/components/ItemList";

export default async function DashboardPage() {
  const user = await requireUser();
  const items = await listVisibleItems(user.id);

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
      <ItemList items={items} currentUserId={user.id} />
    </div>
  );
}
