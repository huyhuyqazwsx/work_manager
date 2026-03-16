import { Inject, Injectable, Logger } from '@nestjs/common';
import * as fileUploadQueueRepositoryInterface from '@modules/leave/domain/repositories/file-upload-queue.repository.interface';
import * as leaveRepositoryInterface from '@modules/leave/domain/repositories/leave.repository.interface';
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
    @Inject('ILeaveRequestRepository')
    private readonly leaveRepository: leaveRepositoryInterface.ILeaveRequestRepository,
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

          await Promise.all([
            this.leaveRepository.update(item.leaveRequestId, {
              attachmentUrl: cloudUrl,
            }),
            this.fileUploadQueueRepository.delete(item.id),
            fs.unlink(item.localPath),
          ]);

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
