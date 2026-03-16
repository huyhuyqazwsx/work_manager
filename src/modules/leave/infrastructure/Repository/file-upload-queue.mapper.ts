import { FileUploadQueue } from '@domain/entities/file-queue.entity';
import { FileUploadQueue as PrismaFileUploadQueue } from '@prisma/client';

export class FileUploadQueueMapper {
  static toDomain(raw: PrismaFileUploadQueue): FileUploadQueue {
    return new FileUploadQueue(
      raw.id,
      raw.leaveRequestId,
      raw.localPath,
      raw.retryCount,
      raw.createdAt,
    );
  }

  static toPersistence(
    entity: FileUploadQueue | Partial<FileUploadQueue>,
  ): Record<string, unknown> {
    return {
      ...entity,
    };
  }
}
