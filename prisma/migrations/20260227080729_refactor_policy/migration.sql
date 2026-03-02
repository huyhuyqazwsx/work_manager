/*
  Warnings:

  - You are about to drop the column `defaultMultiplier` on the `overtime_types` table. All the data in the column will be lost.
  - You are about to drop the `leave_policy_values` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ot_policy_values` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `policies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `policy_conditions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "leave_requests_createdBy_idx";

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "paidPersonalEventCode" TEXT;

-- AlterTable
ALTER TABLE "overtime_types" DROP COLUMN "defaultMultiplier";

-- DropTable
DROP TABLE "leave_policy_values";

-- DropTable
DROP TABLE "ot_policy_values";

-- DropTable
DROP TABLE "policies";

-- DropTable
DROP TABLE "policy_conditions";

-- CreateTable
CREATE TABLE "paid_personal_leave_usages" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventCode" TEXT NOT NULL,
    "usedDays" DOUBLE PRECISION NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveRequestId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paid_personal_leave_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compensation_transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "sourceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compensation_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_configs" (
    "id" UUID NOT NULL,
    "contractType" TEXT NOT NULL,
    "baseDaysPerYear" DOUBLE PRECISION NOT NULL,
    "bonusDaysPerCycle" DOUBLE PRECISION NOT NULL,
    "bonusYearCycle" INTEGER NOT NULL,
    "maxDaysPerRequest" DOUBLE PRECISION NOT NULL,
    "minimumNoticeDays" INTEGER NOT NULL,
    "prorateByMonth" BOOLEAN NOT NULL DEFAULT true,
    "joinDateCutoffDay" INTEGER NOT NULL DEFAULT 15,
    "carryOverDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowNegativeBalance" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_configs" (
    "id" UUID NOT NULL,
    "contractType" TEXT NOT NULL,
    "maxHoursPerDay" DOUBLE PRECISION NOT NULL,
    "maxHoursPerMonth" DOUBLE PRECISION NOT NULL,
    "maxHoursPerYear" DOUBLE PRECISION NOT NULL,
    "salaryMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paid_personal_leave_events" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowedDays" DOUBLE PRECISION NOT NULL,
    "resetOnUse" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "paid_personal_leave_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "paid_personal_leave_usages_userId_eventCode_year_idx" ON "paid_personal_leave_usages"("userId", "eventCode", "year");

-- CreateIndex
CREATE INDEX "compensation_transactions_userId_idx" ON "compensation_transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_configs_contractType_key" ON "leave_configs"("contractType");

-- CreateIndex
CREATE UNIQUE INDEX "ot_configs_contractType_key" ON "ot_configs"("contractType");

-- CreateIndex
CREATE UNIQUE INDEX "paid_personal_leave_events_code_key" ON "paid_personal_leave_events"("code");

-- CreateIndex
CREATE INDEX "leave_requests_createdBy_leaveTypeId_idx" ON "leave_requests"("createdBy", "leaveTypeId");
