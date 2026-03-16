import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { FileUploadQueue } from '@domain/entities/file-queue.entity';
import { IFileUploadQueueRepository } from '@modules/leave/domain/repositories/file-upload-queue.repository.interface';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { FileUploadQueueMapper } from '@modules/leave/infrastructure/Repository/file-upload-queue.mapper';
import { FileUploadQueue as PrismaFileUploadQueue } from '@prisma/client';

@Injectable()
export class PrismaFileUploadQueueRepository
  extends BasePrismaRepository<FileUploadQueue, PrismaFileUploadQueue>
  implements IFileUploadQueueRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.fileUploadQueue as unknown as PrismaDelegate<PrismaFileUploadQueue>,
      FileUploadQueueMapper,
    );
  }

  async findPending(limit: number): Promise<FileUploadQueue[]> {
    const raws = await this.prismaModel.findMany({
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return raws.map((r) => FileUploadQueueMapper.toDomain(r));
  }

  async incrementRetry(id: string): Promise<void> {
    await this.prisma.fileUploadQueue.update({
      where: { id },
      data: { retryCount: { increment: 1 } },
    });
  }

  async syncToCloud(
    id: string,
    leaveRequestId: string,
    cloudUrl: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: { attachmentUrl: cloudUrl },
      }),
      this.prisma.fileUploadQueue.delete({
        where: { id },
      }),
    ]);
  }
}
