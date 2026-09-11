-- Recurring items: when set, the reminder job rolls dueDate forward by one
-- cycle (and clears stale reminder logs) once the item goes overdue -
-- e.g. a yearly birthday - instead of leaving it sitting in Overdue.

CREATE TYPE "Recurrence" AS ENUM ('MONTHLY', 'YEARLY');

ALTER TABLE "Item" ADD COLUMN "recurrence" "Recurrence";
