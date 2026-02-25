import { Module } from '@nestjs/common';
import { LeaveService } from './application/services/leave.service';
import { LeaveController } from './presentation/controllers/leave.controller';
import { PrismaLeaveRequestRepository } from './infrastructure/Repository/leave.repository';

@Module({
  providers: [
    {
      provide: 'ILeaveService',
      useClass: LeaveService,
    },
    {
      provide: 'ILeaveRequestRepository',
      useClass: PrismaLeaveRequestRepository,
    },
  ],
  controllers: [LeaveController],
})
export class LeaveModule {}
