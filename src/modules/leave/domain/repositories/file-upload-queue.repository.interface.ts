import { FileUploadQueue } from '@domain/entities/file-queue.entity';
import { IBaseRepository } from '@domain/repositories/base.repository';

export interface IFileUploadQueueRepository extends IBaseRepository<FileUploadQueue> {
  findPending(limit: number): Promise<FileUploadQueue[]>;
  incrementRetry(id: string): Promise<void>;
  syncToCloud(
    id: string,
    leaveRequestId: string,
    cloudUrl: string,
  ): Promise<void>;
}
