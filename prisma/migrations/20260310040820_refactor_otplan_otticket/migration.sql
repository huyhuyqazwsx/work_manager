/*
  Warnings:

  - You are about to drop the column `endDate` on the `ot_tickets` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `ot_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `ot_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `ot_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `ot_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ot_plans" ADD COLUMN     "endDate" DATE NOT NULL,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL,
ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "ot_tickets" DROP COLUMN "endDate";
