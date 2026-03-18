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
import {
  HolidaySession,
  LeaveRequestStatus,
  LeaveTypeCode,
} from '@domain/enum/enum';
import { RangeExistDto } from '@modules/leave/application/dto/range-exist.dto';

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

  async getMyLeaveRequests(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLeaveRequests> {
    const skip = (page - 1) * limit;

    const where = { createdBy: userId };

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

  async calculatorUsedDay(
    userId: string,
    targetYear: number,
    leaveTypeCode: string,
  ): Promise<number> {
    const startOfYear = new Date(targetYear, 0, 1); // 1/1/targetYear
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999); // 31/12/targetYear

    const result = await this.prisma.leaveRequest.aggregate({
      _sum: { paidDays: true },
      where: {
        createdBy: userId,
        leaveTypeCode: leaveTypeCode,
        status: {
          in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
        },
        fromDate: { gte: startOfYear },
        toDate: { lte: endOfYear },
      },
    });

    return result._sum.paidDays ?? 0;
  }

  async getAnnualLeaveSummary(
    userId: string,
    year: number,
  ): Promise<{
    usedPaidDays: number;
    usedUnpaidDays: number;
    totalDays: number;
  }> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const [annualSummary, unpaidSummary] = await Promise.all([
      // Query cho Annual Leave
      this.prisma.leaveRequest.aggregate({
        where: {
          createdBy: userId,
          leaveTypeCode: LeaveTypeCode.ANNUAL,
          status: {
            in: [LeaveRequestStatus.APPROVED, LeaveRequestStatus.PENDING],
          },
          fromDate: { gte: startOfYear, lte: endOfYear },
        },
        _sum: {
          paidDays: true,
          totalDays: true,
        },
      }),

      // Query unpaid của tất cả leave
      this.prisma.leaveRequest.aggregate({
        where: {
          createdBy: userId,
          status: {
            in: [LeaveRequestStatus.APPROVED, LeaveRequestStatus.PENDING],
          },
          fromDate: { gte: startOfYear, lte: endOfYear },
        },
        _sum: {
          unpaidDays: true,
        },
      }),
    ]);

    return {
      usedPaidDays: annualSummary._sum.paidDays ?? 0,
      usedUnpaidDays: unpaidSummary._sum.unpaidDays ?? 0,
      totalDays: annualSummary._sum.totalDays ?? 0,
    };
  }

  async findOverlapping(
    userId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LeaveRequest[]> {
    const raws = await this.prisma.leaveRequest.findMany({
      where: {
        createdBy: userId,
        status: {
          in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
        },
        fromDate: { lte: toDate },
        toDate: { gte: fromDate },
      },
    });

    return raws.map((r) => LeaveRequestMapper.toDomain(r));
  }

  async getRangeExistLeaveRequest(
    userId: string,
    targetYear: number,
  ): Promise<RangeExistDto> {
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const raws = await this.prisma.leaveRequest.findMany({
      where: {
        createdBy: userId,
        status: {
          in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
        },
        AND: [
          { fromDate: { lte: endOfYear } },
          { toDate: { gte: startOfYear } },
        ],
      },
      select: {
        fromDate: true,
        toDate: true,
        fromSession: true,
        toSession: true,
      },
    });

    return {
      range: raws.map((r) => ({
        fromDate: r.fromDate,
        toDate: r.toDate,
        fromSession: r.fromSession as HolidaySession,
        toSession: r.toSession as HolidaySession,
      })),
    };
  }

  async getLeaveRequestByBod(): Promise<LeaveRequest[]> {
    const managers = await this.prisma.department.findMany({
      select: {
        managerId: true,
      },
    });

    const managerIds = managers
      .map((d) => d.managerId)
      .filter((id): id is string => id !== null);

    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: {
        createdBy: {
          in: managerIds,
        },
        status: LeaveRequestStatus.PENDING,
      },
      orderBy: {
        fromDate: 'asc',
      },
    });

    return leaveRequests.map((r) => LeaveRequestMapper.toDomain(r));
  }

  async findPendingForAutoReject(limit: number): Promise<LeaveRequest[]> {
    const raws = await this.prismaModel.findMany({
      where: { status: LeaveRequestStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return raws.map((r) => LeaveRequestMapper.toDomain(r));
  }
}
