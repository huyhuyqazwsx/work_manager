import { EmailQueue } from '@domain/entities/email-queue.entity';

import { EmailQueue as PrismaEmailQueue } from '@prisma/client';

export class EmailQueueMapper {
  static toDomain(raw: PrismaEmailQueue): EmailQueue {
    return new EmailQueue(
      raw.id,
      raw.email,
      raw.type,
      raw.payload,
      raw.createdAt,
    );
  }

  static toPersistence(entity: EmailQueue) {
    return {
      id: entity.id,
      email: entity.email,
      type: entity.type,
      payload: entity.payload,
      createdAt: entity.createdAt,
    };
  }
}
