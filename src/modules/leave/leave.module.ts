import { Module } from '@nestjs/common';
import { LeaveService } from './application/services/leave.service';
import { LeaveController } from './presentation/controllers/leave.controller';
import { PrismaLeaveRequestRepository } from './infrastructure/Repository/leave.repository';
import { HolidayModule } from '../holiday/holiday.module';
import { LeaveTypeModule } from '../leave-type/leave-type.module';
import { UserModule } from '../user/user.module';
import { PolicyModule } from '../policy/policy.module';
import { DepartmentModule } from '../department/department.module';

@Module({
  imports: [
    HolidayModule,
    LeaveTypeModule,
    UserModule,
    PolicyModule,
    DepartmentModule,
  ],
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
