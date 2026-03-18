import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as otTicketServiceInterface from '@modules/ot-ticket/application/interfaces/ot-ticket.service.interface';

@Injectable()
export class OTTicketCronJob {
  private readonly logger = new Logger(OTTicketCronJob.name);
  private isRunning = false;

  constructor(
    @Inject('IOTTicketService')
    private readonly otTicketService: otTicketServiceInterface.IOTTicketService,
  ) {}

  @Cron('*/10 * * * * *') // 1 tiếng 1 lần
  async processOTTicketLifecycle(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('OTTicket lifecycle job is still running, skipping...');
      return;
    }

    this.isRunning = true;
    try {
      await this.otTicketService.processOTTicketLifecycle();
    } finally {
      this.isRunning = false;
    }
  }
}
