import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, Task } from "@/lib/generated/prisma/client";
import { AuthError, requireApiUser, type CurrentUser } from "@/lib/auth-utils";
import { bankableWorkSeconds, DONE_RETENTION_DAYS, WORK_SECONDS, type TaskDTO } from "@/lib/taskTimer";
import { ACTION_ITEM_CATEGORY } from "@/lib/constants";
import { toDateOnlyString } from "@/lib/dates";
import type { TaskAction } from "@/lib/validators/task";

type Tx = Prisma.TransactionClient;

export function toTaskDTO(task: Task): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    type: task.type,
    status: task.status,
    sortOrder: task.sortOrder,
    phase: task.phase,
    phaseStartedAt: task.phaseStartedAt?.toISOString() ?? null,
    workedSeconds: task.workedSeconds,
    rounds: task.rounds,
    completedAt: task.completedAt?.toISOString() ?? null,
    dueDate: task.dueDate ? toDateOnlyString(task.dueDate) : null,
    dueTime: task.dueTime,
    isPrivate: task.isPrivate,
  };
}

/**
 * Keeps a task's "Action Item" appointment in step with it: created or
 * updated while the task has a deadline (completed alongside it), removed
 * when the deadline is cleared.
 */
export async function syncTaskItem(db: Tx | typeof prisma, task: Task): Promise<void> {
  if (!task.dueDate) {
    await db.item.deleteMany({ where: { taskId: task.id } });
    return;
  }
  const data = {
    title: task.title,
    notes: task.notes,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    completedAt: task.status === "DONE" ? task.completedAt : null,
  };
  await db.item.upsert({
    where: { taskId: task.id },
    create: {
      ...data,
      category: ACTION_ITEM_CATEGORY,
      visibility: "PRIVATE",
      ownerId: task.ownerId,
      taskId: task.id,
    },
    update: data,
  });
}

export async function isTaskBoardEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { taskBoardEnabled: true },
  });
  return user?.taskBoardEnabled ?? false;
}

/** `requireApiUser`, plus a 403 unless the user has opted in to the task board. */
export async function requireTaskBoardUser(request: NextRequest): Promise<CurrentUser> {
  const user = await requireApiUser(request);
  if (!(await isTaskBoardEnabled(user.id))) {
    throw new AuthError("Task board is disabled", 403);
  }
  return user;
}

function doneRetentionCutoff(): Date {
  return new Date(Date.now() - DONE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

/** Deletes Done tasks older than DONE_RETENTION_DAYS (run by the scheduler). */
export async function purgeExpiredDoneTasks(): Promise<number> {
  const { count } = await prisma.task.deleteMany({
    where: { status: "DONE", completedAt: { lt: doneRetentionCutoff() } },
  });
  return count;
}

export async function listTasks(userId: string, db: Tx | typeof prisma = prisma): Promise<TaskDTO[]> {
  const tasks = await db.task.findMany({
    // Expired Done cards are hidden even before the scheduler gets to them.
    where: {
      ownerId: userId,
      OR: [{ status: { not: "DONE" } }, { completedAt: { gte: doneRetentionCutoff() } }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return tasks.map(toTaskDTO);
}

export async function loadOwnedTask(id: string, userId: string, db: Tx | typeof prisma = prisma) {
  const task = await db.task.findUnique({ where: { id } });
  if (!task || task.ownerId !== userId) throw new AuthError("Task not found", 404);
  return task;
}

/** Clears a task's running phase, banking any work time it was clocking. */
function stopTimer(task: Task, now: Date): Prisma.TaskUpdateInput {
  return {
    phase: null,
    phaseStartedAt: null,
    workedSeconds: task.workedSeconds + bankableWorkSeconds(task, now.getTime()),
  };
}

/** Renumbers the queue 0..n-1, with `insertId` placed at `index` (or last). */
async function renumberQueue(tx: Tx, userId: string, insertId?: string, index?: number) {
  const queued = await tx.task.findMany({
    where: { ownerId: userId, status: "QUEUED", ...(insertId ? { id: { not: insertId } } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const ids = queued.map((t) => t.id);
  if (insertId) ids.splice(Math.min(index ?? ids.length, ids.length), 0, insertId);
  await Promise.all(ids.map((id, i) => tx.task.update({ where: { id }, data: { sortOrder: i } })));
}

/**
 * Applies a board move or timer phase change and returns the user's whole
 * board, so the client can reconcile its optimistic state in one go.
 */
export async function transitionTask(userId: string, id: string, input: TaskAction): Promise<TaskDTO[]> {
  return prisma.$transaction(async (tx) => {
    const task = await loadOwnedTask(id, userId, tx);
    const now = new Date();

    switch (input.action) {
      case "activate": {
        if (task.status === "ACTIVE") break;
        // One active card at a time: whatever was running goes back to the
        // top of the queue, so it's the next thing to pick up.
        const current = await tx.task.findMany({ where: { ownerId: userId, status: "ACTIVE" } });
        for (const other of current) {
          await tx.task.update({
            where: { id: other.id },
            data: { ...stopTimer(other, now), status: "QUEUED", sortOrder: -1 },
          });
        }
        await tx.task.update({
          where: { id },
          data: { status: "ACTIVE", phase: "WORK", phaseStartedAt: now, completedAt: null },
        });
        await renumberQueue(tx, userId);
        break;
      }
      case "queue": {
        await tx.task.update({
          where: { id },
          data: { ...stopTimer(task, now), status: "QUEUED", completedAt: null },
        });
        await renumberQueue(tx, userId, id, input.index);
        break;
      }
      case "complete": {
        if (task.status === "DONE") break;
        await tx.task.update({
          where: { id },
          data: { ...stopTimer(task, now), status: "DONE", completedAt: now },
        });
        await renumberQueue(tx, userId);
        break;
      }
      case "startRest": {
        if (task.status !== "ACTIVE") throw new AuthError("Task is not active", 409);
        if (task.phase === "REST") break;
        const banked = bankableWorkSeconds(task, now.getTime());
        const limit = WORK_SECONDS[task.type];
        // A timed round only counts once its full work phase ran; an
        // open-ended (Free) session counts whenever the break is taken.
        const finishedRound = task.phase === "WORK" && (limit === null ? banked > 0 : banked >= limit);
        await tx.task.update({
          where: { id },
          data: {
            phase: "REST",
            phaseStartedAt: now,
            workedSeconds: task.workedSeconds + banked,
            rounds: task.rounds + (finishedRound ? 1 : 0),
          },
        });
        break;
      }
      case "startWork": {
        if (task.status !== "ACTIVE") throw new AuthError("Task is not active", 409);
        await tx.task.update({
          where: { id },
          data: { ...stopTimer(task, now), phase: "WORK", phaseStartedAt: now },
        });
        break;
      }
    }

    // Completing (or restoring) a task completes (or reopens) its Action Item.
    const updated = await tx.task.findUniqueOrThrow({ where: { id } });
    if (updated.dueDate) await syncTaskItem(tx, updated);

    return listTasks(userId, tx);
  });
}

/** Sets the queue order to `ids` (any ids that aren't the user's queued tasks are ignored). */
export async function reorderQueue(userId: string, ids: string[]): Promise<TaskDTO[]> {
  return prisma.$transaction(async (tx) => {
    const queued = await tx.task.findMany({
      where: { ownerId: userId, status: "QUEUED" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const queuedIds = new Set(queued.map((t) => t.id));
    const ordered = ids.filter((id) => queuedIds.has(id));
    // Anything the client didn't mention keeps its relative order, after the rest.
    const rest = queued.map((t) => t.id).filter((id) => !ordered.includes(id));
    await Promise.all(
      [...ordered, ...rest].map((id, i) => tx.task.update({ where: { id }, data: { sortOrder: i } }))
    );
    return listTasks(userId, tx);
  });
}
