import { LeaveTypeController } from './presentation/controllers/leave-type.controller';
import { Module } from '@nestjs/common';
import { LeaveTypeService } from './application/services/leave-type.service';
import { PrismaLeaveTypeRepository } from './infrastructure/leave-type.repository';

@Module({
  providers: [
    {
      provide: 'ILeaveTypeService',
      useClass: LeaveTypeService,
    },
    {
      provide: 'ILeaveTypeRepository',
      useClass: PrismaLeaveTypeRepository,
    },
  ],
  controllers: [LeaveTypeController],
})
export class LeaveTypeModule {}
