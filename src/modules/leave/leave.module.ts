import { Module } from '@nestjs/common';
import { LeaveService } from './application/services/leave.service';
import { LeaveController } from './presentation/controllers/leave.controller';
import { PrismaLeaveRequestRepository } from './infrastructure/Repository/leave.repository';
import { HolidayModule } from '../holiday/holiday.module';
import { LeaveTypeModule } from '../leave-type/leave-type.module';
import { UserModule } from '../user/user.module';
import { PolicyModule } from '../policy/policy.module';
import { DepartmentModule } from '../department/department.module';
import { StorageModule } from '@infra/storage/storage.module';
import { CompensationModule } from '@modules/compensation/compensation.module';
import { PrismaFileUploadQueueRepository } from '@modules/leave/infrastructure/Repository/file-upload-queue.repository';
import { FileUploadCronJob } from '@modules/leave/application/worker/file-handle.worker';

@Module({
  imports: [
    HolidayModule,
    LeaveTypeModule,
    UserModule,
    PolicyModule,
    DepartmentModule,
    StorageModule,
    CompensationModule,
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
    {
      provide: 'IFileUploadQueueRepository',
      useClass: PrismaFileUploadQueueRepository,
    },
    FileUploadCronJob,
  ],
  controllers: [LeaveController],
})
export class LeaveModule {}
