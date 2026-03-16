import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as mailServiceInterface from '@modules/mail/application/interfaces/mail.service.interface';

@Injectable()
export class MailWorker {
  private readonly logger = new Logger(MailWorker.name);
  private isProcessing = false;

  constructor(
    @Inject('IMailService')
    private readonly mailService: mailServiceInterface.IMailService,
  ) {}

  @Cron('*/5 * * * * *')
  async handleEmailQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.mailService.processEmailQueue();
    } catch (error) {
      this.logger.error('Email worker failed', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
