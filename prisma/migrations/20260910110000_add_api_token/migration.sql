-- AlterTable
ALTER TABLE "User" ADD COLUMN "apiTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_apiTokenHash_key" ON "User"("apiTokenHash");
