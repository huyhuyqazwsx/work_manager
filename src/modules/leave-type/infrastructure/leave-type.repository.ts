import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '../../../infrastructure/repository/base/base-prisma.repository';
import { LeaveType as PrismaLeaveType} from '@prisma/client';
import { LeaveType } from '../../../domain/entities/leave_type.entity';
import { ILeaveTypeRepository } from '../domain/repositories/leave-type.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/PrismaService';
import { LeaveTypeMapper } from './leave-type.mapper';

@Injectable()
export class PrismaLeaveTypeRepository
  extends BasePrismaRepository<LeaveType, PrismaLeaveType>
  implements ILeaveTypeRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma.leaveType as unknown as PrismaDelegate<PrismaLeaveType>,
      LeaveTypeMapper,
    );
  }
}
