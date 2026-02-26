/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "code" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "users_code_key" ON "users"("code");
