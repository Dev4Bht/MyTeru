-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_userId_fkey";

-- DropIndex
DROP INDEX "users_phone_idx";

-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "isTrusted";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "failedLoginCount",
DROP COLUMN "isPhoneVerified",
DROP COLUMN "lockedUntil",
DROP COLUMN "passwordHash",
DROP COLUMN "phone",
ADD COLUMN     "googleId" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "otps";

-- DropEnum
DROP TYPE "OtpChannel";

-- DropEnum
DROP TYPE "OtpPurpose";

-- CreateIndex
CREATE UNIQUE INDEX "profiles_phone_key" ON "profiles"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

