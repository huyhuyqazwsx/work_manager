import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import * as leaveServiceInterface from '@modules/leave/application/interfaces/leave.service.interface';

@Injectable()
export class LeaveAutoRejectWorker {
  private readonly logger = new Logger(LeaveAutoRejectWorker.name);
  private isRunning = false;

  constructor(
    @Inject('ILeaveService')
    private readonly leaveService: leaveServiceInterface.ILeaveService,
  ) {}

  @Cron('0 0 * * * *')
  async processOverdueLeaveRequests(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      const pending = await this.leaveService.findPendingForAutoReject(50);

      for (const leave of pending) {
        try {
          const isRetroactive = leave.createdAt > leave.fromDate;

          if (!isRetroactive) {
            if (now > leave.fromDate) {
              await this.leaveService.autoRejectLeave(
                leave.id,
                'Auto-rejected by the system: The leave start time has passed without manager approval',
              );
            }
          } else {
            const daysUntilEndOfMonth =
              new Date(
                leave.createdAt.getFullYear(),
                leave.createdAt.getMonth() + 1,
                0,
              ).getDate() - leave.createdAt.getDate();

            const deadlineDays = Math.min(7, daysUntilEndOfMonth);
            const deadline = new Date(
              leave.createdAt.getTime() + deadlineDays * 24 * 60 * 60 * 1000,
            );

            if (now > deadline) {
              await this.leaveService.autoRejectLeave(
                leave.id,
                'Auto-rejected by the system: The manager did not approve the request within the required timeframe.',
              );
            }
          }
        } catch (err) {
          this.logger.error(`Failed to auto-reject leave ${leave.id}`, err);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}
