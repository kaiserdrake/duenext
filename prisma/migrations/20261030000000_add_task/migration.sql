-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('SHORT', 'LONG', 'FREE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('QUEUED', 'ACTIVE', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPhase" AS ENUM ('WORK', 'REST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "taskBoardEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'SHORT',
    "status" "TaskStatus" NOT NULL DEFAULT 'QUEUED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "phase" "TaskPhase",
    "phaseStartedAt" TIMESTAMP(3),
    "workedSeconds" INTEGER NOT NULL DEFAULT 0,
    "rounds" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_ownerId_status_idx" ON "Task"("ownerId", "status");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
