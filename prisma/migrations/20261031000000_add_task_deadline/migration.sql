-- AlterTable
ALTER TABLE "Task" ADD COLUMN "dueDate" DATE,
ADD COLUMN "dueTime" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN "taskId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Item_taskId_key" ON "Item"("taskId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
