import { FileUploadQueue } from '@domain/entities/file-queue.entity';

export interface IFileUploadQueueRepository {
  save(queue: FileUploadQueue): Promise<void>;
  findPending(limit: number): Promise<FileUploadQueue[]>;
  delete(id: string): Promise<void>;
  incrementRetry(id: string): Promise<void>;
}
