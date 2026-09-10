import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);
    const users = await prisma.user.findMany({
      // Admin accounts are for managing the app, not for picking as item
      // recipients, so they're left out of the "share with" picker.
      where: { isActive: true, role: { not: "ADMIN" } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
