/*
  Warnings:

  - Added the required column `departmentId` to the `leave_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "departmentId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "leave_requests_departmentId_idx" ON "leave_requests"("departmentId");

-- CreateIndex
CREATE INDEX "leave_requests_createdBy_idx" ON "leave_requests"("createdBy");
