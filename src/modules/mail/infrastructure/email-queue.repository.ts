import { EmailQueueMapper } from '@modules/mail/infrastructure/email-queue.mapper';
import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { EmailQueue } from '@domain/entities/email-queue.entity';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { EmailQueue as PrismaEmailQueue } from '@prisma/client';

@Injectable()
export class PrismaEmailQueueRepository extends BasePrismaRepository<
  EmailQueue,
  PrismaEmailQueue
> {
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.emailQueue as unknown as PrismaDelegate<PrismaEmailQueue>,
      new EmailQueueMapper(),
    );
  }
}
