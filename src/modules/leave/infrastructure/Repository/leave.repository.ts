import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { LeaveRequest as PrismaLeaveRequest } from '@prisma/client';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { ILeaveRequestRepository } from '../../domain/repositories/leave.repository.interface';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { LeaveRequestMapper } from './leave.mapper';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';

@Injectable()
export class PrismaLeaveRequestRepository
  extends BasePrismaRepository<LeaveRequest, PrismaLeaveRequest>
  implements ILeaveRequestRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
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

  async getLeaveRequestByManagerId(
    managerId: string,
    departmentId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLeaveRequests> {
    const users = await this.prisma.user.findMany({
      where: {
        departmentId,
        id: { not: managerId },
      },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    if (userIds.length === 0) {
      return {
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const skip = (page - 1) * limit;

    const where = {
      createdBy: { in: userIds },
      status: 'PENDING',
    };

    const [rows, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    const data = rows.map((r) => LeaveRequestMapper.toDomain(r));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
