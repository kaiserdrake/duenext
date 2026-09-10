import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export interface ReminderEmailInput {
  to: string;
  itemTitle: string;
  dueDateLabel: string;
  offsetLabel: string;
}

export async function sendReminderEmail({
  to,
  itemTitle,
  dueDateLabel,
  offsetLabel,
}: ReminderEmailInput): Promise<void> {
  const client = getTransporter();
  if (!client) {
    console.warn(`[email] SMTP_HOST not configured, skipping email to ${to}`);
    return;
  }

  await client.sendMail({
    from: process.env.SMTP_FROM || "DueNext <duenext@example.com>",
    to,
    subject: `Reminder: ${itemTitle} - ${offsetLabel}`,
    text: `${itemTitle} is due ${dueDateLabel} (${offsetLabel}).`,
  });
}
