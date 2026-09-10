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

export async function listVisibleItems(
  userId: string,
  options: { scope?: string; includeCompleted?: boolean } = {}
): Promise<ItemWithRelations[]> {
  const { scope = "all", includeCompleted = false } = options;

  return prisma.item.findMany({
    where: {
      AND: [
        buildVisibilityWhere(userId, scope),
        includeCompleted ? {} : { completedAt: null },
      ],
    },
    include: itemWithRelations,
    orderBy: { dueDate: "asc" },
  });
}
