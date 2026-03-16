-- CreateTable
CREATE TABLE "file_upload_queues" (
    "id" UUID NOT NULL,
    "leaveRequestId" UUID NOT NULL,
    "localPath" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_upload_queues_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file_upload_queues" ADD CONSTRAINT "file_upload_queues_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
