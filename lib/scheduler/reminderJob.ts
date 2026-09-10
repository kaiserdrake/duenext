import { prisma } from "@/lib/prisma";
import { computeDueInstant } from "@/lib/dates";
import { dispatchReminder } from "@/lib/notifications/dispatch";
import type { Channel } from "@/lib/generated/prisma/enums";

interface RecipientCandidate {
  id: string;
  email: string;
  isActive: boolean;
  notifyByEmail: boolean;
  notifyByNtfy: boolean;
  ntfyServerUrl: string | null;
  ntfyTopic: string | null;
  ntfyAccessToken: string | null;
}

export async function runReminderJob(): Promise<void> {
  const timezone = process.env.REMINDER_TIMEZONE || "UTC";
  const now = new Date();

  const [items, activeUsers] = await Promise.all([
    prisma.item.findMany({
      where: { completedAt: null },
      include: {
        owner: true,
        sharedWith: { include: { user: true } },
        reminderLogs: true,
      },
    }),
    prisma.user.findMany({ where: { isActive: true } }),
  ]);

  const activeUsersById = new Map(activeUsers.map((u) => [u.id, u]));

  for (const item of items) {
    const dueInstant = computeDueInstant(item.dueDate, item.dueTime, timezone);

    const dueOffsets = item.reminderOffsetsMinutes.filter((offsetMinutes) => {
      const targetInstant = new Date(dueInstant.getTime() - offsetMinutes * 60_000);
      return targetInstant <= now;
    });

    if (dueOffsets.length === 0) continue;

    const recipients = resolveRecipients(item, activeUsersById);
    if (recipients.length === 0) continue;

    const alreadySent = new Set(
      item.reminderLogs.map((log) => `${log.userId}:${log.offsetMinutes}:${log.channel}`)
    );

    const sends: Array<Promise<void>> = [];

    for (const offsetMinutes of dueOffsets) {
      for (const recipient of recipients) {
        const channels: Channel[] = [
          ...(recipient.notifyByEmail ? (["EMAIL"] as const) : []),
          ...(recipient.notifyByNtfy ? (["NTFY"] as const) : []),
        ];

        for (const channel of channels) {
          const key = `${recipient.id}:${offsetMinutes}:${channel}`;
          if (alreadySent.has(key)) continue;

          sends.push(
            sendAndLog({
              itemId: item.id,
              itemTitle: item.title,
              dueDate: item.dueDate,
              dueTime: item.dueTime,
              offsetMinutes,
              channel,
              recipient,
            })
          );
        }
      }
    }

    const results = await Promise.allSettled(sends);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[reminderJob] send failed:", result.reason);
      }
    }
  }
}

function resolveRecipients(
  item: {
    visibility: string;
    owner: RecipientCandidate;
    sharedWith: { user: RecipientCandidate }[];
  },
  activeUsersById: Map<string, RecipientCandidate>
): RecipientCandidate[] {
  const byId = new Map<string, RecipientCandidate>();

  const add = (user: RecipientCandidate) => {
    if (user.isActive) byId.set(user.id, user);
  };

  if (item.visibility === "SHARED") {
    for (const user of activeUsersById.values()) add(user);
  } else if (item.visibility === "CUSTOM") {
    add(item.owner);
    for (const share of item.sharedWith) add(share.user);
  } else {
    add(item.owner);
  }

  return Array.from(byId.values());
}

async function sendAndLog(params: {
  itemId: string;
  itemTitle: string;
  dueDate: Date;
  dueTime: string | null;
  offsetMinutes: number;
  channel: Channel;
  recipient: RecipientCandidate;
}): Promise<void> {
  const { itemId, itemTitle, dueDate, dueTime, offsetMinutes, channel, recipient } = params;

  await dispatchReminder({
    recipient,
    channel,
    itemTitle,
    dueDate,
    dueTime,
    offsetMinutes,
  });

  try {
    await prisma.reminderLog.create({
      data: { itemId, userId: recipient.id, offsetMinutes, channel },
    });
  } catch (error) {
    // Unique constraint race: another process already logged this send.
    console.warn("[reminderJob] log write skipped (likely duplicate):", error);
  }
}
