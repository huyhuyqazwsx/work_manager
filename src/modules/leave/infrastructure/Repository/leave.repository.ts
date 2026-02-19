import { Injectable } from '@nestjs/common';
import { BasePrismaRepository } from '../../../../infrastructure/repository/base/base-prisma.repository';
import { LeaveRequest as PrismaLeaveRequest } from '@prisma/client';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';
import { ILeaveRequestRepository } from '../../domain/repositories/leave.repository.interface';
import { PrismaService } from '../../../../infrastructure/database/prisma/PrismaService';
import { LeaveRequestMapper } from './leave.mapper';

@Injectable()
export class PrismaLeaveRequestRepository
  extends BasePrismaRepository<LeaveRequest, PrismaLeaveRequest>
  implements ILeaveRequestRepository
{
  constructor(prisma: PrismaService) {
    super(prisma.leaveRequest, LeaveRequestMapper);
  }
}
