import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { listVisibleItemsDueBetween } from "@/lib/items";
import { getWeekRange } from "@/lib/dates";

/** The current week (Monday-Sunday) of active items visible to the caller. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const timezone = process.env.REMINDER_TIMEZONE || "UTC";
    const { start, end, startLabel, endLabel } = getWeekRange(timezone);

    const items = await listVisibleItemsDueBetween(user.id, start, end);

    return NextResponse.json({ weekStart: startLabel, weekEnd: endLabel, items });
  } catch (error) {
    return handleApiError(error);
  }
}
