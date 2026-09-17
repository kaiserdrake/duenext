import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { todoInputSchema } from "@/lib/validators/todo";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const todos = await prisma.todo.findMany({
      where: { ownerId: user.id },
      orderBy: [{ done: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ todos });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const input = todoInputSchema.parse(body);

    const last = await prisma.todo.aggregate({
      where: { ownerId: user.id },
      _max: { sortOrder: true },
    });

    const todo = await prisma.todo.create({
      data: {
        title: input.title,
        notes: input.notes || null,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        ownerId: user.id,
      },
    });

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
