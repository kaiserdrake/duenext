import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { itemWithRelations } from "@/lib/items";
import { toDateOnlyString } from "@/lib/dates";
import ItemForm from "@/components/ItemForm";

export default async function EditItemPage({
  params,
}: PageProps<"/items/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser();

  const item = await prisma.item.findUnique({
    where: { id },
    include: itemWithRelations,
  });

  if (!item) notFound();
  if (item.ownerId !== user.id) redirect("/");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-lg font-medium">Edit item</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Update details, sharing, or reminders for this item.
      </p>
      <ItemForm
        currentUserId={user.id}
        initial={{
          id: item.id,
          title: item.title,
          category: item.category ?? "",
          dueDate: toDateOnlyString(item.dueDate),
          dueTime: item.dueTime ?? "",
          notes: item.notes ?? "",
          visibility: item.visibility,
          reminderOffsetsMinutes: item.reminderOffsetsMinutes,
          userIds: item.sharedWith.map((s) => s.userId),
          completedAt: item.completedAt ? item.completedAt.toISOString() : null,
        }}
      />
    </div>
  );
}
