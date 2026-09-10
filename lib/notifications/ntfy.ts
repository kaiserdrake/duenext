export interface NtfyRecipient {
  ntfyServerUrl: string | null;
  ntfyTopic: string | null;
  ntfyAccessToken: string | null;
}

interface PublishInput {
  recipient: NtfyRecipient;
  title: string;
  message: string;
  tags?: string[];
}

async function publishToNtfy({ recipient, title, message, tags }: PublishInput): Promise<void> {
  const serverUrl = recipient.ntfyServerUrl || process.env.DEFAULT_NTFY_URL;
  const topic = recipient.ntfyTopic;

  if (!serverUrl || !topic) {
    throw new Error("No Ntfy server URL or topic configured");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (recipient.ntfyAccessToken) {
    headers.Authorization = `Bearer ${recipient.ntfyAccessToken}`;
  }

  // Publish via ntfy's JSON API rather than the header-based one: title and
  // message can contain any Unicode text (e.g. Japanese), and HTTP headers
  // can only hold ISO-8859-1 bytes, so a non-Latin1 title in a header would
  // throw instead of sending.
  let response: Response;
  try {
    response = await fetch(serverUrl.replace(/\/+$/, ""), {
      method: "POST",
      headers,
      body: JSON.stringify({ topic, title, message, priority: 3, tags }),
    });
  } catch (error) {
    // A network-level failure (DNS, connection refused, TLS, etc.) throws a
    // generic "fetch failed" TypeError - the actually useful detail is in
    // `.cause`, which we'd otherwise lose.
    throw new Error(`Could not reach ${serverUrl}: ${describeNetworkError(error)}`);
  }

  if (!response.ok) {
    throw new Error(`ntfy publish failed: ${response.status} ${response.statusText}`);
  }
}

function describeNetworkError(error: unknown): string {
  const cause = error instanceof Error ? error.cause : undefined;
  if (cause && typeof cause === "object") {
    const code = "code" in cause ? String(cause.code) : undefined;
    const hostname = "hostname" in cause ? String(cause.hostname) : undefined;
    if (code) return hostname ? `${code} (${hostname})` : code;
    if ("message" in cause) return String(cause.message);
  }
  return error instanceof Error ? error.message : "unknown error";
}

export interface ReminderNtfyInput {
  recipient: NtfyRecipient;
  itemTitle: string;
  dueDateLabel: string;
  offsetLabel: string;
}

export async function sendNtfyNotification({
  recipient,
  itemTitle,
  dueDateLabel,
  offsetLabel,
}: ReminderNtfyInput): Promise<void> {
  if (!recipient.ntfyServerUrl && !process.env.DEFAULT_NTFY_URL) {
    console.warn("[ntfy] no server configured for recipient, skipping");
    return;
  }
  if (!recipient.ntfyTopic) {
    console.warn("[ntfy] no topic configured for recipient, skipping");
    return;
  }

  await publishToNtfy({
    recipient,
    title: `Reminder: ${itemTitle}`,
    message: `${itemTitle} is due ${dueDateLabel} (${offsetLabel}).`,
    tags: ["bell"],
  });
}

/** Used by the "send test notification" button in profile settings - unlike
 * sendNtfyNotification, missing config is a real error here since the user
 * is actively testing, not a background job to skip quietly. */
export async function sendTestNtfyNotification(recipient: NtfyRecipient): Promise<void> {
  await publishToNtfy({
    recipient,
    title: "DueNext test notification",
    message: "If you can see this, your Ntfy setup is working.",
    tags: ["white_check_mark"],
  });
}
