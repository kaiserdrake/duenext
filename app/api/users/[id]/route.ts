import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { userUpdateSchema } from "@/lib/validators/user";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/users/[id]">
) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new AuthError("User not found", 404);
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/users/[id]">
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const body = await request.json();
    const input = userUpdateSchema.parse(body);

    if (id === admin.id && input.role === "USER") {
      return NextResponse.json(
        { error: "You can't demote your own account" },
        { status: 400 }
      );
    }
    if (id === admin.id && input.isActive === false) {
      return NextResponse.json(
        { error: "You can't deactivate your own account" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        role: input.role,
        isActive: input.isActive,
        passwordHash: input.password ? await bcrypt.hash(input.password, 12) : undefined,
      },
      select: userSelect,
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/users/[id]">
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    if (id === admin.id) {
      return NextResponse.json(
        { error: "You can't delete your own account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
