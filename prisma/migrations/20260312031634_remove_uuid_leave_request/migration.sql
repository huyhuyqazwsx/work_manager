-- AlterTable
ALTER TABLE "leave_requests" ALTER COLUMN "createdBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ot_plans" ALTER COLUMN "approvedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ot_tickets" ALTER COLUMN "verifiedBy" SET DATA TYPE TEXT;
