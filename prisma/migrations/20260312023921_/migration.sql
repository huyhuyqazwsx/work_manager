/*
  Warnings:

  - You are about to drop the column `userId` on the `compensation_balances` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `email_queue` table. All the data in the column will be lost.
  - You are about to drop the column `leaveTypeId` on the `leave_requests` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `ot_plans` table. All the data in the column will be lost.
  - You are about to drop the `compensation_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paid_personal_leave_usages` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userCode,year]` on the table `compensation_balances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userCode` to the `compensation_balances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `compensation_balances` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "compensation_balances_userId_key";

-- DropIndex
DROP INDEX "leave_requests_createdBy_leaveTypeId_idx";

-- AlterTable
ALTER TABLE "compensation_balances" DROP COLUMN "userId",
ADD COLUMN     "userCode" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "email_queue" DROP COLUMN "email",
ADD COLUMN     "emailCC" TEXT,
ADD COLUMN     "emailSend" TEXT;

-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "leaveTypeId",
ADD COLUMN     "emailCC" TEXT,
ADD COLUMN     "emailSend" TEXT,
ADD COLUMN     "leaveTypeCode" TEXT,
ALTER COLUMN "approvedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ot_plans" DROP COLUMN "userIds",
ADD COLUMN     "ticketPayload" JSONB;

-- DropTable
DROP TABLE "compensation_transactions";

-- DropTable
DROP TABLE "paid_personal_leave_usages";

-- CreateIndex
CREATE UNIQUE INDEX "compensation_balances_userCode_year_key" ON "compensation_balances"("userCode", "year");

-- CreateIndex
CREATE INDEX "leave_requests_createdBy_leaveTypeCode_idx" ON "leave_requests"("createdBy", "leaveTypeCode");
