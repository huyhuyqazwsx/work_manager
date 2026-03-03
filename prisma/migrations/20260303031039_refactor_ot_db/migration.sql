/*
  Warnings:

  - You are about to drop the column `sourceId` on the `compensation_transactions` table. All the data in the column will be lost.
  - You are about to drop the `attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ot_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `overtime_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `overtime_types` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "compensation_transactions" DROP COLUMN "sourceId",
ADD COLUMN     "leaveRequestId" UUID,
ADD COLUMN     "otTicketId" UUID;

-- DropTable
DROP TABLE "attendances";

-- DropTable
DROP TABLE "ot_configs";

-- DropTable
DROP TABLE "overtime_requests";

-- DropTable
DROP TABLE "overtime_types";

-- CreateTable
CREATE TABLE "ot_plans" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "managerId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rejectedBy" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ot_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_tickets" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "otType" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "actualHours" DOUBLE PRECISION,
    "plan" TEXT,
    "result" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ot_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_config" (
    "id" UUID NOT NULL,
    "maxHoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "maxHoursPerMonth" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "maxHoursPerYear" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ot_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ot_plans_departmentId_idx" ON "ot_plans"("departmentId");

-- CreateIndex
CREATE INDEX "ot_plans_managerId_idx" ON "ot_plans"("managerId");

-- CreateIndex
CREATE INDEX "ot_plans_status_idx" ON "ot_plans"("status");

-- CreateIndex
CREATE INDEX "ot_tickets_planId_idx" ON "ot_tickets"("planId");

-- CreateIndex
CREATE INDEX "ot_tickets_userId_idx" ON "ot_tickets"("userId");

-- CreateIndex
CREATE INDEX "ot_tickets_workDate_idx" ON "ot_tickets"("workDate");

-- CreateIndex
CREATE INDEX "ot_tickets_status_idx" ON "ot_tickets"("status");

-- AddForeignKey
ALTER TABLE "ot_tickets" ADD CONSTRAINT "ot_tickets_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ot_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
