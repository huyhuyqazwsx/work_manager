import { Global, Module } from '@nestjs/common';
import { MailController } from './presentation/controllers/mail.controller';
import { MailService } from './application/services/mail.service';

@Global()
@Module({
  controllers: [MailController],
  providers: [
    {
      provide: 'IMailService',
      useClass: MailService,
    },
  ],
  exports: ['IMailService'],
})
export class MailModule {}
