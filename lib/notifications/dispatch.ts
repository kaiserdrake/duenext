import { format } from "date-fns";
import { sendReminderEmail } from "@/lib/notifications/email";
import { sendNtfyNotification } from "@/lib/notifications/ntfy";
import { formatDueTime } from "@/lib/dates";
import { offsetLabel } from "@/lib/reminderOffsets";
import type { Channel } from "@/lib/generated/prisma/enums";

export interface DispatchRecipient {
  email: string;
  ntfyServerUrl: string | null;
  ntfyTopic: string | null;
  ntfyAccessToken: string | null;
}

export interface DispatchInput {
  recipient: DispatchRecipient;
  channel: Channel;
  itemTitle: string;
  dueDate: Date;
  dueTime?: string | null;
  offsetMinutes: number;
}

export async function dispatchReminder({
  recipient,
  channel,
  itemTitle,
  dueDate,
  dueTime,
  offsetMinutes,
}: DispatchInput): Promise<void> {
  const dueDateLabel = dueTime
    ? `${format(dueDate, "yyyy-MM-dd")} at ${formatDueTime(dueTime)}`
    : format(dueDate, "yyyy-MM-dd");
  const label = offsetLabel(offsetMinutes);

  if (channel === "EMAIL") {
    await sendReminderEmail({
      to: recipient.email,
      itemTitle,
      dueDateLabel,
      offsetLabel: label,
    });
    return;
  }

  await sendNtfyNotification({
    recipient,
    itemTitle,
    dueDateLabel,
    offsetLabel: label,
  });
}
