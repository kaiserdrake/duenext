-- Reminder offsets switch from whole days to minutes, so hour/minute-level
-- reminders (not just day-level) can be configured. Existing values are
-- converted (multiplied by 1440) so their real-world meaning is unchanged.

-- Item.reminderOffsets (days) -> Item.reminderOffsetsMinutes (minutes)
ALTER TABLE "Item" RENAME COLUMN "reminderOffsets" TO "reminderOffsetsMinutes";
ALTER TABLE "Item" ALTER COLUMN "reminderOffsetsMinutes" SET DEFAULT ARRAY[43200, 20160, 10080, 1440, 0];
UPDATE "Item"
SET "reminderOffsetsMinutes" = ARRAY(
  SELECT v * 1440 FROM unnest("reminderOffsetsMinutes") AS v
);

-- ReminderLog.offsetDays (days) -> ReminderLog.offsetMinutes (minutes)
DROP INDEX "ReminderLog_itemId_userId_offsetDays_channel_key";
ALTER TABLE "ReminderLog" RENAME COLUMN "offsetDays" TO "offsetMinutes";
UPDATE "ReminderLog" SET "offsetMinutes" = "offsetMinutes" * 1440;
CREATE UNIQUE INDEX "ReminderLog_itemId_userId_offsetMinutes_channel_key" ON "ReminderLog"("itemId", "userId", "offsetMinutes", "channel");
