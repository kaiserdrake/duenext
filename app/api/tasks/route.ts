import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { listTasks, requireTaskBoardUser, syncTaskItem, toTaskDTO } from "@/lib/tasks";
import { parseDateOnlyString } from "@/lib/dates";
import { taskInputSchema } from "@/lib/validators/task";

export async function GET(request: NextRequest) {
  try {
    const user = await requireTaskBoardUser(request);
    return NextResponse.json({ tasks: await listTasks(user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireTaskBoardUser(request);
    const body = await request.json();
    const input = taskInputSchema.parse(body);

    const last = await prisma.task.aggregate({
      where: { ownerId: user.id, status: "QUEUED" },
      _max: { sortOrder: true },
    });

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          title: input.title,
          notes: input.notes || null,
          type: input.type,
          dueDate: input.dueDate ? parseDateOnlyString(input.dueDate) : null,
          dueTime: (input.dueDate && input.dueTime) || null,
          isPrivate: input.isPrivate,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
          ownerId: user.id,
        },
      });
      await syncTaskItem(tx, created);
      return created;
    });

    return NextResponse.json({ task: toTaskDTO(task) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
