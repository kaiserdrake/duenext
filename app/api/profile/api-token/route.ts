import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { generateApiToken, hashApiToken } from "@/lib/apiToken";

// Generates (or regenerates, invalidating any previous one) the caller's
// personal API token. The raw token is only ever returned here, once -
// only its hash is stored, so it can't be recovered later.
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const token = generateApiToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { apiTokenHash: hashApiToken(token) },
    });

    return NextResponse.json({ token });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    await prisma.user.update({
      where: { id: user.id },
      data: { apiTokenHash: null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
