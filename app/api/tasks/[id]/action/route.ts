import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireTaskBoardUser, transitionTask } from "@/lib/tasks";
import { taskActionSchema } from "@/lib/validators/task";

/** Moves a task between Queue / Active / Done, or switches its timer phase. Returns the whole board. */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]/action">
) {
  try {
    const user = await requireTaskBoardUser(request);
    const { id } = await ctx.params;
    const input = taskActionSchema.parse(await request.json());

    return NextResponse.json({ tasks: await transitionTask(user.id, id, input) });
  } catch (error) {
    return handleApiError(error);
  }
}
