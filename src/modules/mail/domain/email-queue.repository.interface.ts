import { EmailQueue } from '@domain/entities/email-queue.entity';
import { IBaseRepository } from '@domain/repositories/base.repository';

export interface IEmailQueueRepository extends IBaseRepository<EmailQueue> {
  getEmailQueue(batchSize: number): Promise<EmailQueue[]>;
}
