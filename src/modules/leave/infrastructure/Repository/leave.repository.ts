import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '../../../../infrastructure/repository/base/base-prisma.repository';
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
    super(
      prisma.leaveRequest as unknown as PrismaDelegate<PrismaLeaveRequest>,
      LeaveRequestMapper,
    );
  }
  async getByUserId(userId: string): Promise<LeaveRequest[]> {
    const records = await this.prismaModel.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => LeaveRequestMapper.toDomain(r));
  }
}
