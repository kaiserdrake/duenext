import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

export const itemWithRelations = {
  owner: { select: { id: true, name: true } },
  sharedWith: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} as const;

export type ItemWithRelations = Prisma.ItemGetPayload<{
  include: typeof itemWithRelations;
}>;

export function buildVisibilityWhere(
  userId: string,
  scope: string
): Prisma.ItemWhereInput {
  const visibleOr: Prisma.ItemWhereInput = {
    OR: [
      { ownerId: userId },
      { visibility: "SHARED" },
      { visibility: "CUSTOM", sharedWith: { some: { userId } } },
    ],
  };

  if (scope === "mine") return { ownerId: userId };
  if (scope === "shared") {
    return { AND: [visibleOr, { ownerId: { not: userId } }] };
  }
  return visibleOr;
}

export type ItemStatus = "active" | "completed" | "all";

function statusWhere(status: ItemStatus): Prisma.ItemWhereInput {
  if (status === "completed") return { completedAt: { not: null } };
  if (status === "all") return {};
  return { completedAt: null };
}

export async function listVisibleItems(
  userId: string,
  options: { scope?: string; status?: ItemStatus } = {}
): Promise<ItemWithRelations[]> {
  const { scope = "all", status = "active" } = options;

  return prisma.item.findMany({
    where: {
      AND: [buildVisibilityWhere(userId, scope), statusWhere(status)],
    },
    include: itemWithRelations,
    orderBy: { dueDate: "asc" },
  });
}
