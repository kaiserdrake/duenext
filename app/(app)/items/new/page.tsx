import { requireUser } from "@/lib/auth-utils";
import ItemForm from "@/components/ItemForm";

export default async function NewItemPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-lg font-medium">New item</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Track an expiration or due date and choose when to be reminded.
      </p>
      <ItemForm currentUserId={user.id} />
    </div>
  );
}
