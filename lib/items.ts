import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { getMonthRange, getTodayDateString, parseDateOnlyString } from "@/lib/dates";

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

/** Active items visible to `userId` with a due date in [start, end] (inclusive). */
export async function listVisibleItemsDueBetween(
  userId: string,
  start: Date,
  end: Date
): Promise<ItemWithRelations[]> {
  return prisma.item.findMany({
    where: {
      AND: [
        buildVisibilityWhere(userId, "all"),
        statusWhere("active"),
        { dueDate: { gte: start, lte: end } },
      ],
    },
    include: itemWithRelations,
    orderBy: { dueDate: "asc" },
  });
}

export interface MonthlySummary {
  dueThisMonth: number;
  overdue: number;
  completedThisMonth: number;
}

export async function getMonthlySummary(userId: string, timeZone: string): Promise<MonthlySummary> {
  const visible = buildVisibilityWhere(userId, "all");
  const { start: monthStart, end: monthEnd } = getMonthRange(timeZone);
  const todayDate = parseDateOnlyString(getTodayDateString(timeZone));

  // completedAt has time-of-day precision (unlike dueDate), so the month's
  // upper bound needs to be the start of the *next* month, exclusive -
  // monthEnd itself is only midnight of the last day.
  const nextMonthStart = new Date(monthEnd);
  nextMonthStart.setUTCDate(nextMonthStart.getUTCDate() + 1);

  const [dueThisMonth, overdue, completedThisMonth] = await Promise.all([
    prisma.item.count({
      where: {
        AND: [visible, statusWhere("active"), { dueDate: { gte: monthStart, lte: monthEnd } }],
      },
    }),
    prisma.item.count({
      where: { AND: [visible, statusWhere("active"), { dueDate: { lt: todayDate } }] },
    }),
    prisma.item.count({
      where: { AND: [visible, { completedAt: { gte: monthStart, lt: nextMonthStart } }] },
    }),
  ]);

  return { dueThisMonth, overdue, completedThisMonth };
}
