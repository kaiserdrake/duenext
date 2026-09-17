import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, AuthError } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { todoUpdateSchema } from "@/lib/validators/todo";

async function loadOwnedTodo(id: string, userId: string) {
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.ownerId !== userId) throw new AuthError("Todo not found", 404);
  return todo;
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/todos/[id]">
) {
  try {
    const user = await requireApiUser(request);
    const { id } = await ctx.params;
    await loadOwnedTodo(id, user.id);

    const body = await request.json();
    const input = todoUpdateSchema.parse(body);

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        title: input.title,
        notes: input.notes === undefined ? undefined : input.notes || null,
        done: input.done,
        sortOrder: input.sortOrder,
      },
    });

    return NextResponse.json({ todo });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/todos/[id]">
) {
  try {
    const user = await requireApiUser(request);
    const { id } = await ctx.params;
    await loadOwnedTodo(id, user.id);

    await prisma.todo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
