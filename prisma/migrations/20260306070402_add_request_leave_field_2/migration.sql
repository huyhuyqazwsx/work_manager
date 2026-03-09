/*
  Warnings:

  - Made the column `fromSession` on table `leave_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `toSession` on table `leave_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "leave_requests" ALTER COLUMN "fromSession" SET NOT NULL,
ALTER COLUMN "toSession" SET NOT NULL;
