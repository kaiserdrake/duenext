import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, AuthError } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { itemUpdateSchema } from "@/lib/validators/item";
import { parseDateOnlyString } from "@/lib/dates";
import { itemWithRelations } from "@/lib/items";

async function loadVisibleItem(id: string, userId: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: itemWithRelations,
  });

  if (!item) throw new AuthError("Item not found", 404);

  const visible =
    item.ownerId === userId ||
    item.visibility === "SHARED" ||
    (item.visibility === "CUSTOM" &&
      item.sharedWith.some((share) => share.userId === userId));

  if (!visible) throw new AuthError("Item not found", 404);

  return item;
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/items/[id]">
) {
  try {
    const user = await requireApiUser(request);
    const { id } = await ctx.params;
    const item = await loadVisibleItem(id, user.id);
    return NextResponse.json({ item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/items/[id]">
) {
  try {
    const user = await requireApiUser(request);
    const { id } = await ctx.params;

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) throw new AuthError("Item not found", 404);
    if (existing.ownerId !== user.id) throw new AuthError("Not allowed", 403);

    const body = await request.json();
    const input = itemUpdateSchema.parse(body);

    // Reminder logs dedupe sends for a given due date/time. If either
    // changes - most commonly when reactivating an archived item with a
    // new due date - stale logs from the previous due date would wrongly
    // suppress the new cycle's reminders, so clear them.
    const newDueDate = input.dueDate ? parseDateOnlyString(input.dueDate) : undefined;
    const newDueTime = input.dueTime === undefined ? undefined : input.dueTime || null;
    const dueDateChanged = newDueDate !== undefined && newDueDate.getTime() !== existing.dueDate.getTime();
    const dueTimeChanged = newDueTime !== undefined && newDueTime !== existing.dueTime;

    const item = await prisma.$transaction(async (tx) => {
      if (dueDateChanged || dueTimeChanged) {
        await tx.reminderLog.deleteMany({ where: { itemId: id } });
      }

      return tx.item.update({
        where: { id },
        data: {
          title: input.title,
          category: input.category === undefined ? undefined : input.category || null,
          dueDate: newDueDate,
          dueTime: newDueTime,
          notes: input.notes === undefined ? undefined : input.notes || null,
          visibility: input.visibility,
          reminderOffsetsMinutes: input.reminderOffsetsMinutes,
          completedAt:
            input.completedAt === undefined
              ? undefined
              : input.completedAt
                ? new Date(input.completedAt)
                : null,
          sharedWith:
            input.userIds !== undefined
              ? {
                  deleteMany: {},
                  create: input.userIds.map((userId) => ({ userId })),
                }
              : undefined,
        },
        include: itemWithRelations,
      });
    });

    return NextResponse.json({ item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/items/[id]">
) {
  try {
    const user = await requireApiUser(request);
    const { id } = await ctx.params;

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) throw new AuthError("Item not found", 404);
    if (existing.ownerId !== user.id) throw new AuthError("Not allowed", 403);

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
