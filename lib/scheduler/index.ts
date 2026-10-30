import * as cron from "node-cron";
import { runReminderJob } from "@/lib/scheduler/reminderJob";
import { purgeExpiredDoneTasks } from "@/lib/tasks";

const globalForScheduler = globalThis as unknown as {
  __duenextSchedulerStarted?: boolean;
};

export function startScheduler(): void {
  if (globalForScheduler.__duenextSchedulerStarted) return;
  globalForScheduler.__duenextSchedulerStarted = true;

  cron.schedule(
    "*/5 * * * *",
    async () => {
      try {
        await runReminderJob();
      } catch (error) {
        console.error("[scheduler] reminder job failed:", error);
      }
    },
    { name: "duenext-reminders", noOverlap: true }
  );

  console.log("[scheduler] reminder job scheduled (every 5 minutes)");

  cron.schedule(
    "17 * * * *",
    async () => {
      try {
        const count = await purgeExpiredDoneTasks();
        if (count > 0) console.log(`[scheduler] cleared ${count} expired done task(s)`);
      } catch (error) {
        console.error("[scheduler] done-task cleanup failed:", error);
      }
    },
    { name: "duenext-done-task-cleanup", noOverlap: true }
  );
}
