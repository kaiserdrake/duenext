import { requireUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { itemWithRelations } from "@/lib/items";
import ItemForm, { type ItemFormValues } from "@/components/ItemForm";

export default async function NewItemPage(props: PageProps<"/items/new">) {
  const user = await requireUser();
  const { templateId } = await props.searchParams;

  let initial: Omit<ItemFormValues, "id" | "dueDate" | "completedAt"> | undefined;

  if (typeof templateId === "string") {
    const template = await prisma.item.findUnique({
      where: { id: templateId },
      include: itemWithRelations,
    });
    if (template && template.ownerId === user.id) {
      initial = {
        title: template.title,
        category: template.category ?? "",
        dueTime: template.dueTime ?? "",
        notes: template.notes ?? "",
        visibility: template.visibility,
        recurrence: template.recurrence ?? "",
        reminderOffsetsMinutes: template.reminderOffsetsMinutes,
        userIds: template.sharedWith.map((s) => s.userId),
      };
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-lg font-medium">New item</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Track an expiration or due date and choose when to be reminded.
      </p>
      <ItemForm
        currentUserId={user.id}
        initial={initial ? { ...initial, dueDate: "", completedAt: null } : undefined}
      />
    </div>
  );
}
