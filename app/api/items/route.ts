import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { itemInputSchema } from "@/lib/validators/item";
import { parseDateOnlyString } from "@/lib/dates";
import { listVisibleItems, itemWithRelations, type ItemStatus } from "@/lib/items";

const VALID_STATUSES: ItemStatus[] = ["active", "completed", "all"];

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "all";
    const statusParam = searchParams.get("status");
    const status = VALID_STATUSES.includes(statusParam as ItemStatus)
      ? (statusParam as ItemStatus)
      : "active";

    const items = await listVisibleItems(user.id, { scope, status });
    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const input = itemInputSchema.parse(body);

    const item = await prisma.item.create({
      data: {
        title: input.title,
        category: input.category || null,
        dueDate: parseDateOnlyString(input.dueDate),
        dueTime: input.dueTime || null,
        notes: input.notes || null,
        visibility: input.visibility,
        reminderOffsetsMinutes: input.reminderOffsetsMinutes,
        ownerId: user.id,
        sharedWith:
          input.visibility === "CUSTOM"
            ? { create: input.userIds.map((userId) => ({ userId })) }
            : undefined,
      },
      include: itemWithRelations,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
