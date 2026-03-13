/*
  Warnings:

  - The `emailCC` column on the `email_queue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `emailCC` column on the `leave_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "email_queue" DROP COLUMN "emailCC",
ADD COLUMN     "emailCC" TEXT[];

-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "emailCC",
ADD COLUMN     "emailCC" TEXT[];
