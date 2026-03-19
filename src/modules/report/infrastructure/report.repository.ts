import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { LeaveRequestStatus, LeaveTypeCode } from '@domain/enum/enum';
import {
  HolidayRaw,
  IReportRepository,
  LeaveRequestRaw,
} from '@modules/report/domain/repositories/report.repository.interface';
import { GetLeaveReportDto } from '@modules/report/application/dto/get-leave-report.dto';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';
import { Prisma } from '@prisma/client';
import { LeaveRequestMapper } from '@modules/leave/infrastructure/Repository/leave.mapper';
import { OTPlanMapper } from '@modules/ot-plan/infrastructure/ot-plan.mapper';
import { OTPlan } from '@domain/entities/ot-plan.entity';
import { GetOTPlanReportDto } from '@modules/report/application/dto/get-ot-plan-report.dto';

@Injectable()
export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovedLeaveByMonth(
    month: number,
    year: number,
  ): Promise<LeaveRequestRaw[]> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const rows = await this.prisma.leaveRequest.findMany({
      where: {
        status: LeaveRequestStatus.APPROVED,
        fromDate: { lte: endOfMonth },
        toDate: { gte: startOfMonth },
      },
      orderBy: { fromDate: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      createdBy: r.createdBy,
      leaveTypeCode: r.leaveTypeCode ?? '',
      fromDate: r.fromDate,
      toDate: r.toDate,
      fromSession: r.fromSession,
      toSession: r.toSession,
      paidDays: r.paidDays,
      unpaidDays: r.unpaidDays,
      totalDays: r.totalDays,
      status: r.status as LeaveRequestStatus,
    }));
  }

  async findApprovedPaidLeaveByYear(year: number): Promise<LeaveRequestRaw[]> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const rows = await this.prisma.leaveRequest.findMany({
      where: {
        status: LeaveRequestStatus.APPROVED,
        leaveTypeCode: LeaveTypeCode.ANNUAL,
        paidDays: { gt: 0 },
        fromDate: { lte: endOfYear },
        toDate: { gte: startOfYear },
      },
      orderBy: { fromDate: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      createdBy: r.createdBy,
      leaveTypeCode: r.leaveTypeCode ?? '',
      fromDate: r.fromDate,
      toDate: r.toDate,
      fromSession: r.fromSession,
      toSession: r.toSession,
      paidDays: r.paidDays,
      unpaidDays: r.unpaidDays,
      totalDays: r.totalDays,
      status: r.status as LeaveRequestStatus,
    }));
  }

  async getLeaveRangeBoundaryAll(
    month: number,
    year: number,
  ): Promise<{ minDate: Date | null; maxDate: Date | null }> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await this.prisma.leaveRequest.aggregate({
      where: {
        status: LeaveRequestStatus.APPROVED,
        fromDate: { lte: endOfMonth },
        toDate: { gte: startOfMonth },
      },
      _min: { fromDate: true },
      _max: { toDate: true },
    });

    return {
      minDate: result._min.fromDate,
      maxDate: result._max.toDate,
    };
  }

  async findHolidaysByMonth(
    month: number,
    year: number,
  ): Promise<HolidayRaw[]> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const rows = await this.prisma.holiday.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { date: true, session: true },
    });

    return rows.map((r) => ({
      date: r.date,
      session: r.session,
    }));
  }

  async getLeaveReport(
    dto: GetLeaveReportDto,
  ): Promise<PaginatedLeaveRequests> {
    const {
      search,
      departmentId,
      leaveTypeCode,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = dto;

    const skip = (page - 1) * limit;

    const userWhere: Prisma.UserWhereInput = {
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    if ((search || departmentId) && !userIds.length) {
      return {
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const where: Prisma.LeaveRequestWhereInput = {
      ...(userIds.length && { createdBy: { in: userIds } }),
      ...(leaveTypeCode && { leaveTypeCode }),
      ...(status && { status }),
      ...(fromDate && { fromDate: { gte: new Date(fromDate) } }),
      ...(toDate && { toDate: { lte: new Date(toDate) } }),
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

    return {
      data: rows.map((r) => LeaveRequestMapper.toDomain(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOTPlanReport(dto: GetOTPlanReportDto): Promise<{
    data: OTPlan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { search, departmentId, status, month, page = 1, limit = 10 } = dto;

    const currentPage = Math.max(page, 1);
    const pageSize = Math.min(limit, 50);
    const skip = (currentPage - 1) * pageSize;

    const andConditions: Prisma.OTPlanWhereInput[] = [];

    if (status) andConditions.push({ status });

    if (search) {
      andConditions.push({
        OR: [{ reason: { contains: search, mode: 'insensitive' } }],
      });
    }

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startOfMonth = new Date(year, m - 1, 1);
      const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);
      andConditions.push(
        { startDate: { lte: endOfMonth } },
        { endDate: { gte: startOfMonth } },
      );
    }

    if (departmentId) {
      const managers = await this.prisma.user.findMany({
        where: { departmentId },
        select: { id: true },
      });
      const managerIds = managers.map((u) => u.id);

      if (!managerIds.length) {
        return {
          data: [],
          pagination: {
            page: currentPage,
            limit: pageSize,
            total: 0,
            totalPages: 0,
          },
        };
      }

      andConditions.push({ managerId: { in: managerIds } });
    }

    const where: Prisma.OTPlanWhereInput = andConditions.length
      ? { AND: andConditions }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.oTPlan.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.oTPlan.count({ where }),
    ]);

    return {
      data: rows.map((r) => OTPlanMapper.toDomain(r)),
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
