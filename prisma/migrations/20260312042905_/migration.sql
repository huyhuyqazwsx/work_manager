/*
  Warnings:

  - You are about to drop the column `endTime` on the `ot_plans` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `ot_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ot_plans" DROP COLUMN "endTime",
DROP COLUMN "startTime";
