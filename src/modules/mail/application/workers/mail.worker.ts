import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as mailServiceInterface from '@modules/mail/application/interfaces/mail.service.interface';

@Injectable()
export class MailWorker {
  private readonly logger = new Logger(MailWorker.name);
  constructor(
    @Inject('IMailService')
    private readonly mailService: mailServiceInterface.IMailService,
  ) {}

  // chạy mỗi 5 giây
  @Cron('*/5 * * * * *')
  async handleEmailQueue() {
    this.logger.debug('Checking email queue...');

    try {
      await this.mailService.processEmailQueue();
    } catch (error) {
      this.logger.error('Email worker failed', error);
    }
  }
}
