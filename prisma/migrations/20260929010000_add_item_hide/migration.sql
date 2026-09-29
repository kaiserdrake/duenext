-- CreateTable
CREATE TABLE "ItemHide" (
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemHide_pkey" PRIMARY KEY ("itemId","userId")
);

-- CreateIndex
CREATE INDEX "ItemHide_userId_idx" ON "ItemHide"("userId");

-- AddForeignKey
ALTER TABLE "ItemHide" ADD CONSTRAINT "ItemHide_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemHide" ADD CONSTRAINT "ItemHide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
