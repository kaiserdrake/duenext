import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { itemInputSchema } from "@/lib/validators/item";
import { getTodayDateString, parseDateOnlyString, rollDueDateForward } from "@/lib/dates";
import { listVisibleItems, itemWithRelations, type ItemStatus } from "@/lib/items";

const VALID_STATUSES: ItemStatus[] = ["active", "completed", "all"];

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
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
    const user = await requireApiUser(request);
    const body = await request.json();
    const input = itemInputSchema.parse(body);

    // A recurring item's due date can be entered in the past (e.g. an
    // actual birthdate) - resolve it to the next upcoming occurrence right
    // away, rather than leaving it overdue until the reminder job's next run.
    const recurrence = input.recurrence || null;
    let dueDate = parseDateOnlyString(input.dueDate);
    if (recurrence) {
      const timezone = process.env.REMINDER_TIMEZONE || "UTC";
      dueDate = rollDueDateForward(dueDate, recurrence, parseDateOnlyString(getTodayDateString(timezone)));
    }

    const item = await prisma.item.create({
      data: {
        title: input.title,
        category: input.category || null,
        dueDate,
        dueTime: input.dueTime || null,
        notes: input.notes || null,
        visibility: input.visibility,
        recurrence,
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
