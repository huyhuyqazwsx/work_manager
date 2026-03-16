import { FileUploadQueue } from '@domain/entities/file-queue.entity';
import { Injectable } from '@nestjs/common';
import { IFileUploadQueueRepository } from '@modules/leave/domain/repositories/file-upload-queue.repository.interface';
import { PrismaService } from '@infra/database/prisma/PrismaService';

@Injectable()
export class PrismaFileUploadQueueRepository implements IFileUploadQueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(queue: FileUploadQueue): Promise<void> {
    await this.prisma.fileUploadQueue.create({
      data: {
        id: queue.id,
        leaveRequestId: queue.leaveRequestId,
        localPath: queue.localPath,
        retryCount: queue.retryCount,
        createdAt: queue.createdAt,
      },
    });
  }

  async findPending(limit: number): Promise<FileUploadQueue[]> {
    const raws = await this.prisma.fileUploadQueue.findMany({
      where: { retryCount: { lt: 3 } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return raws.map(
      (r) =>
        new FileUploadQueue(
          r.id,
          r.leaveRequestId,
          r.localPath,
          r.retryCount,
          r.createdAt,
        ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.fileUploadQueue.delete({ where: { id } });
  }

  async incrementRetry(id: string): Promise<void> {
    await this.prisma.fileUploadQueue.update({
      where: { id },
      data: { retryCount: { increment: 1 } },
    });
  }
}
