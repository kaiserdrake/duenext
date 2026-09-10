import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireApiUser, AuthError } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { profileUpdateSchema } from "@/lib/validators/profile";

const profileSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  ntfyServerUrl: true,
  ntfyTopic: true,
  ntfyAccessToken: true,
  notifyByEmail: true,
  notifyByNtfy: true,
  apiTokenHash: true,
} as const;

// Never send the hash itself down the wire - just whether a token exists.
function toProfileResponse(profile: { apiTokenHash: string | null } & Record<string, unknown>) {
  const { apiTokenHash, ...rest } = profile;
  return { ...rest, apiTokenSet: apiTokenHash !== null };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: profileSelect,
    });
    return NextResponse.json({
      profile: profile ? toProfileResponse(profile) : null,
      defaultNtfyUrl: process.env.DEFAULT_NTFY_URL ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const input = profileUpdateSchema.parse(body);

    let passwordHash: string | undefined;
    if (input.newPassword) {
      const record = await prisma.user.findUnique({ where: { id: user.id } });
      if (!record) throw new AuthError("Not signed in", 401);
      const valid = await bcrypt.compare(input.currentPassword ?? "", record.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
      passwordHash = await bcrypt.hash(input.newPassword, 12);
    }

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        passwordHash,
        ntfyServerUrl: input.ntfyServerUrl === undefined ? undefined : input.ntfyServerUrl || null,
        ntfyTopic: input.ntfyTopic === undefined ? undefined : input.ntfyTopic || null,
        ntfyAccessToken:
          input.ntfyAccessToken === undefined ? undefined : input.ntfyAccessToken || null,
        notifyByEmail: input.notifyByEmail,
        notifyByNtfy: input.notifyByNtfy,
      },
      select: profileSelect,
    });

    return NextResponse.json({ profile: toProfileResponse(profile) });
  } catch (error) {
    return handleApiError(error);
  }
}
