import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashApiToken } from "@/lib/apiToken";
import type { Role } from "@/lib/generated/prisma/enums";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Not signed in", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new AuthError("Admin access required", 403);
  }
  return user;
}

/**
 * Authenticates an API route request via either the browser session cookie
 * or an `Authorization: Bearer <token>` header carrying a user's personal
 * API token (see profile settings) - so routes work both from the web app
 * and from external scripts/automation.
 */
export async function getApiUser(request: NextRequest): Promise<CurrentUser | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return null;

    const user = await prisma.user.findUnique({ where: { apiTokenHash: hashApiToken(token) } });
    if (!user || !user.isActive) return null;

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  return getCurrentUser();
}

export async function requireApiUser(request: NextRequest): Promise<CurrentUser> {
  const user = await getApiUser(request);
  if (!user) {
    throw new AuthError("Not authenticated", 401);
  }
  return user;
}

export async function requireApiAdmin(request: NextRequest): Promise<CurrentUser> {
  const user = await requireApiUser(request);
  if (user.role !== "ADMIN") {
    throw new AuthError("Admin access required", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
