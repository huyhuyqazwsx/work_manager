import { Global, Module } from '@nestjs/common';
import { MailController } from './presentation/controllers/mail.controller';
import { MailService } from './application/services/mail.service';
import { PrismaEmailQueueRepository } from '@modules/mail/infrastructure/email-queue.repository';
import { MailWorker } from '@modules/mail/application/workers/mail.worker';

@Global()
@Module({
  controllers: [MailController],
  providers: [
    MailWorker,
    {
      provide: 'IEmailQueueRepository',
      useClass: PrismaEmailQueueRepository,
    },
    {
      provide: 'IMailService',
      useClass: MailService,
    },
  ],
  exports: ['IMailService'],
})
export class MailModule {}
