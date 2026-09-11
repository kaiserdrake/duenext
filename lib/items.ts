import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { getMonthRange, getWeekRange } from "@/lib/dates";

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

export interface CategoryCount {
  category: string;
  count: number;
}

export interface DashboardSummaryData {
  monthCategoryCounts: CategoryCount[];
  subscriptions: { dueThisMonth: number; total: number };
  appointments: { dueThisWeek: number; dueThisMonth: number; total: number };
}

/** Matches a category by exact name, case-insensitively - same convention as CategoryIcon. */
function categoryWhere(name: string): Prisma.ItemWhereInput {
  return { category: { equals: name, mode: "insensitive" } };
}

export async function getDashboardSummary(userId: string, timeZone: string): Promise<DashboardSummaryData> {
  const visible = buildVisibilityWhere(userId, "all");
  const active = statusWhere("active");
  const { start: monthStart, end: monthEnd } = getMonthRange(timeZone);
  const { start: weekStart, end: weekEnd } = getWeekRange(timeZone);

  const subscriptionFilter = categoryWhere("Subscription");
  const appointmentFilter = categoryWhere("Appointment");

  const [
    categoryCounts,
    subscriptionsDueThisMonth,
    subscriptionsTotal,
    appointmentsDueThisWeek,
    appointmentsDueThisMonth,
    appointmentsTotal,
  ] = await Promise.all([
    prisma.item.groupBy({
      by: ["category"],
      where: { AND: [visible, active, { dueDate: { gte: monthStart, lte: monthEnd } }] },
      _count: { _all: true },
    }),
    prisma.item.count({
      where: { AND: [visible, active, subscriptionFilter, { dueDate: { gte: monthStart, lte: monthEnd } }] },
    }),
    prisma.item.count({
      where: { AND: [visible, active, subscriptionFilter] },
    }),
    prisma.item.count({
      where: { AND: [visible, active, appointmentFilter, { dueDate: { gte: weekStart, lte: weekEnd } }] },
    }),
    prisma.item.count({
      where: { AND: [visible, active, appointmentFilter, { dueDate: { gte: monthStart, lte: monthEnd } }] },
    }),
    prisma.item.count({
      where: { AND: [visible, active, appointmentFilter] },
    }),
  ]);

  const monthCategoryCounts = categoryCounts
    .map(({ category, _count }) => ({ category: category?.trim() || "Uncategorized", count: _count._all }))
    .sort((a, b) => b.count - a.count);

  return {
    monthCategoryCounts,
    subscriptions: { dueThisMonth: subscriptionsDueThisMonth, total: subscriptionsTotal },
    appointments: {
      dueThisWeek: appointmentsDueThisWeek,
      dueThisMonth: appointmentsDueThisMonth,
      total: appointmentsTotal,
    },
  };
}
