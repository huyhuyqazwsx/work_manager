-- AlterTable
ALTER TABLE "holidays" ADD COLUMN     "isCompensatory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalHolidayId" UUID;

-- CreateIndex
CREATE INDEX "holidays_isCompensatory_idx" ON "holidays"("isCompensatory");
