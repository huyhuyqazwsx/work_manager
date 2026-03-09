import { EmailQueueMapper } from '@modules/mail/infrastructure/email-queue.mapper';
import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { EmailQueue } from '@domain/entities/email-queue.entity';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { EmailQueue as PrismaEmailQueue } from '@prisma/client';
import { IEmailQueueRepository } from '@modules/mail/domain/email-queue.repository.interface';

@Injectable()
export class PrismaEmailQueueRepository
  extends BasePrismaRepository<EmailQueue, PrismaEmailQueue>
  implements IEmailQueueRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.emailQueue as unknown as PrismaDelegate<PrismaEmailQueue>,
      EmailQueueMapper,
    );
  }

  async getEmailQueue(batchSize: number): Promise<EmailQueue[]> {
    const raws = await this.prisma.emailQueue.findMany({
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    return raws.map((r) => EmailQueueMapper.toDomain(r));
  }
}
