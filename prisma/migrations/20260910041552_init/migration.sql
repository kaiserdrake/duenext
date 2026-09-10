-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'SHARED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'NTFY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ntfyServerUrl" TEXT,
    "ntfyTopic" TEXT,
    "ntfyAccessToken" TEXT,
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyByNtfy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "dueDate" DATE NOT NULL,
    "notes" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "reminderOffsets" INTEGER[] DEFAULT ARRAY[30, 14, 7, 1, 0]::INTEGER[],
    "completedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemShare" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL,
    "channel" "Channel" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Item_ownerId_idx" ON "Item"("ownerId");

-- CreateIndex
CREATE INDEX "Item_dueDate_idx" ON "Item"("dueDate");

-- CreateIndex
CREATE INDEX "Item_visibility_idx" ON "Item"("visibility");

-- CreateIndex
CREATE INDEX "ItemShare_userId_idx" ON "ItemShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemShare_itemId_userId_key" ON "ItemShare"("itemId", "userId");

-- CreateIndex
CREATE INDEX "ReminderLog_itemId_idx" ON "ReminderLog"("itemId");

-- CreateIndex
CREATE INDEX "ReminderLog_userId_idx" ON "ReminderLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_itemId_userId_offsetDays_channel_key" ON "ReminderLog"("itemId", "userId", "offsetDays", "channel");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemShare" ADD CONSTRAINT "ItemShare_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemShare" ADD CONSTRAINT "ItemShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
