import { Inject, Injectable, Logger } from '@nestjs/common';
import * as fileUploadQueueRepositoryInterface from '@modules/leave/domain/repositories/file-upload-queue.repository.interface';
import { StorageService } from '@infra/storage/storage.service';
import { Cron } from '@nestjs/schedule';
import { promises as fs } from 'node:fs';

@Injectable()
export class FileUploadCronJob {
  private readonly logger = new Logger(FileUploadCronJob.name);
  private isRunning = false;

  constructor(
    @Inject('IFileUploadQueueRepository')
    private readonly fileUploadQueueRepository: fileUploadQueueRepositoryInterface.IFileUploadQueueRepository,
    private readonly storageService: StorageService,
  ) {}

  @Cron('5 * * * * *')
  async syncLocalFiles(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const pending = await this.fileUploadQueueRepository.findPending(50);
      if (!pending.length) return;

      for (const item of pending) {
        try {
          const cloudUrl = await this.storageService.uploadFromLocal(
            item.localPath,
          );

          // atomic
          await this.fileUploadQueueRepository.syncToCloud(
            item.id,
            item.leaveRequestId,
            cloudUrl,
          );

          // xóa file local sau khi DB commit xong
          await fs
            .unlink(item.localPath)
            .catch((err) =>
              this.logger.warn(`Failed to unlink ${item.localPath}`, err),
            );

          this.logger.log(`Synced ${item.id} → ${cloudUrl}`);
        } catch (err) {
          await this.fileUploadQueueRepository.incrementRetry(item.id);
          this.logger.error(
            `Failed to sync ${item.id}, retry ${item.retryCount + 1}`,
            err,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}
