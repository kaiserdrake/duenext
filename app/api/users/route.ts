import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { userCreateSchema } from "@/lib/validators/user";
import { generateNtfyTopic } from "@/lib/notifications/topic";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = userCreateSchema.parse(body);

    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with that email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: input.name,
        passwordHash,
        role: input.role,
        ntfyTopic: generateNtfyTopic(),
      },
      select: userSelect,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
