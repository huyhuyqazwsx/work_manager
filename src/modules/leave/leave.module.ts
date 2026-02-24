import { Module } from '@nestjs/common';
import { LeaveService } from './application/services/leave.service';
import { LeaveController } from './presentation/controllers/leave.controller';

@Module({
  providers: [LeaveService],
  controllers: [LeaveController],
})
export class LeaveModule {}
