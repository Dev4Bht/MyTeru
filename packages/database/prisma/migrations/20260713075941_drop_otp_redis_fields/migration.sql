/*
  Warnings:

  - You are about to drop the column `lastSentAt` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `sendCount` on the `otps` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "otps_phone_purpose_idx";

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "lastSentAt",
DROP COLUMN "sendCount";

-- CreateIndex
CREATE INDEX "otps_phone_purpose_createdAt_idx" ON "otps"("phone", "purpose", "createdAt");
