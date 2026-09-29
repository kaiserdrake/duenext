import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, AuthError } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { buildVisibilityWhere } from "@/lib/items";

/** Hides an item from the current user's Overdue list (until its due date changes). */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/items/[id]/hide">
) {
  try {
    const user = await requireApiUser(request);
    const { id } = await ctx.params;

    const item = await prisma.item.findFirst({
      where: { AND: [{ id }, buildVisibilityWhere(user.id, "all")] },
      select: { id: true, dueDate: true },
    });
    if (!item) throw new AuthError("Item not found", 404);

    await prisma.itemHide.upsert({
      where: { itemId_userId: { itemId: item.id, userId: user.id } },
      create: { itemId: item.id, userId: user.id, dueDate: item.dueDate },
      update: { dueDate: item.dueDate },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Un-hides an item for the current user. */
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/items/[id]/hide">
) {
  try {
    const user = await requireApiUser(request);
    const { id } = await ctx.params;

    await prisma.itemHide.deleteMany({ where: { itemId: id, userId: user.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
