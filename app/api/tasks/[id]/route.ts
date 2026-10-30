import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { loadOwnedTask, requireTaskBoardUser, syncTaskItem, toTaskDTO } from "@/lib/tasks";
import { parseDateOnlyString } from "@/lib/dates";
import { taskUpdateSchema } from "@/lib/validators/task";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">
) {
  try {
    const user = await requireTaskBoardUser(request);
    const { id } = await ctx.params;
    await loadOwnedTask(id, user.id);

    const body = await request.json();
    const input = taskUpdateSchema.parse(body);

    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          title: input.title,
          notes: input.notes === undefined ? undefined : input.notes || null,
          type: input.type,
          // Clearing the date clears the time with it.
          dueDate: input.dueDate === undefined ? undefined : input.dueDate ? parseDateOnlyString(input.dueDate) : null,
          dueTime:
            input.dueDate === "" || input.dueDate === null
              ? null
              : input.dueTime === undefined
                ? undefined
                : input.dueTime || null,
        },
      });
      await syncTaskItem(tx, updated);
      return updated;
    });

    return NextResponse.json({ task: toTaskDTO(task) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">
) {
  try {
    const user = await requireTaskBoardUser(request);
    const { id } = await ctx.params;
    await loadOwnedTask(id, user.id);

    // The Action Item only outlives its task once both are done (see the
    // Item.task relation); deleting the task outright removes it too.
    await prisma.$transaction([
      prisma.item.deleteMany({ where: { taskId: id } }),
      prisma.task.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
