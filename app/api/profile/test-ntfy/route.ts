import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireUser, AuthError } from "@/lib/auth-utils";
import { sendTestNtfyNotification } from "@/lib/notifications/ntfy";

const testNtfySchema = z.object({
  ntfyServerUrl: z.string().trim().optional().nullable(),
  ntfyTopic: z.string().trim().min(1, "Enter a topic first"),
  ntfyAccessToken: z.string().trim().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const input = testNtfySchema.parse(body);

    await sendTestNtfyNotification({
      ntfyServerUrl: input.ntfyServerUrl || null,
      ntfyTopic: input.ntfyTopic,
      ntfyAccessToken: input.ntfyAccessToken || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    // Anything else is the actual ntfy send failing - surface it, since
    // that's exactly what someone testing their setup needs to see.
    const message = error instanceof Error ? error.message : "Failed to send test notification";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
