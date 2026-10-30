import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { reorderQueue, requireTaskBoardUser } from "@/lib/tasks";
import { taskReorderSchema } from "@/lib/validators/task";

/** Sets the queue's priority order from an ordered list of task ids. Returns the whole board. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireTaskBoardUser(request);
    const { ids } = taskReorderSchema.parse(await request.json());

    return NextResponse.json({ tasks: await reorderQueue(user.id, ids) });
  } catch (error) {
    return handleApiError(error);
  }
}
