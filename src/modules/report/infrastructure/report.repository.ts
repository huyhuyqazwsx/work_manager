import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import {
  LeaveRequestStatus,
  LeaveTypeCode,
  OTTicketStatus,
} from '@domain/enum/enum';
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
import { OTSummaryReportItem } from '@modules/report/application/dto/ot-summary-report.dto';
import { OTDetailReportItem } from '@modules/report/application/dto/ot-detail-report.dto';
import {
  OTDetailRowDto,
  OTMonthlyReportDto,
  OTSummaryRowDto,
} from '@modules/report/application/dto/ot-monthly-report.dto';

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
      ...(fromDate &&
        toDate && {
          fromDate: { lte: new Date(toDate) },
          toDate: { gte: new Date(fromDate) },
        }),
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

  async getOTDetailReport(
    departmentId: string,
    month: number,
    year: number,
  ): Promise<OTDetailReportItem[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const users = await this.prisma.user.findMany({
      where: { departmentId },
      select: { id: true, code: true, fullName: true, departmentName: true },
    });

    if (!users.length) return [];

    const userIds = users.map((u) => u.id);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const tickets = await this.prisma.oTTicket.findMany({
      where: {
        userId: { in: userIds },
        status: { in: [OTTicketStatus.COMPLETED, OTTicketStatus.VERIFIED] },
        workDate: { gte: start, lte: end },
      },
      orderBy: [{ userId: 'asc' }, { workDate: 'asc' }],
    });

    return tickets.map((t, i) => {
      const user = userMap.get(t.userId);
      return {
        stt: i + 1,
        userCode: user?.code ?? '',
        fullName: user?.fullName ?? '',
        departmentName: user?.departmentName ?? '',
        workDate: t.workDate,
        startTime: t.startTime,
        endTime: t.endTime,
        checkIn: t.checkIn,
        checkOut: t.checkOut,
        actualHours: t.actualHours ?? 0,
      };
    });
  }

  async getOTMonthlyReportAll(
    month: number,
    year: number,
  ): Promise<OTMonthlyReportDto[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    // 1 query lấy tất cả users + departmentName
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        code: true,
        fullName: true,
        departmentId: true,
        departmentName: true,
      },
    });

    if (!users.length) return [];

    const userIds = users.map((u) => u.id);
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 1 query lấy tất cả departments
    const departments = await this.prisma.department.findMany({
      select: { id: true, name: true },
    });

    // 1 query lấy tất cả tickets trong tháng
    const tickets = await this.prisma.oTTicket.findMany({
      where: {
        userId: { in: userIds },
        status: { in: [OTTicketStatus.COMPLETED, OTTicketStatus.VERIFIED] },
        workDate: { gte: start, lte: end },
      },
      orderBy: [{ userId: 'asc' }, { workDate: 'asc' }],
    });

    // Group tickets theo departmentId
    const ticketsByDept = new Map<string, typeof tickets>();
    for (const t of tickets) {
      const user = userMap.get(t.userId);
      if (!user) continue;
      const list = ticketsByDept.get(user.departmentId) ?? [];
      list.push(t);
      ticketsByDept.set(user.departmentId, list);
    }

    const reports: OTMonthlyReportDto[] = [];

    for (const dept of departments) {
      const deptTickets = ticketsByDept.get(dept.id) ?? [];
      if (!deptTickets.length) continue;

      // Build detail rows
      const detailRows: OTDetailRowDto[] = deptTickets.map((t, i) => {
        const user = userMap.get(t.userId);
        return {
          stt: i + 1,
          userCode: user?.code ?? '',
          fullName: user?.fullName ?? '',
          departmentName: user?.departmentName ?? dept.name,
          workDate: t.workDate,
          startTime: t.startTime,
          endTime: t.endTime,
          checkIn: t.checkIn,
          checkOut: t.checkOut,
          actualHours: t.actualHours ?? 0,
        };
      });

      // Build summary rows — group by userId
      const summaryMap = new Map<
        string,
        { totalHours: number; total: number }
      >();
      for (const t of deptTickets) {
        const existing = summaryMap.get(t.userId);
        if (existing) {
          existing.totalHours += t.actualHours ?? 0;
          existing.total += 1;
        } else {
          summaryMap.set(t.userId, {
            totalHours: t.actualHours ?? 0,
            total: 1,
          });
        }
      }

      const summaryRows: OTSummaryRowDto[] = [...summaryMap.entries()].map(
        ([userId, summary], i) => {
          const user = userMap.get(userId);
          return {
            stt: i + 1,
            userCode: user?.code ?? '',
            fullName: user?.fullName ?? '',
            totalHours: summary.totalHours,
            total: summary.total,
          };
        },
      );

      reports.push({
        month,
        year,
        departmentName: dept.name,
        detailRows,
        summaryRows,
      });
    }

    return reports;
  }

  async getOTSummaryReport(
    departmentId: string,
    month: number,
    year: number,
  ): Promise<OTSummaryReportItem[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const users = await this.prisma.user.findMany({
      where: { departmentId },
      select: { id: true, code: true, fullName: true },
    });

    if (!users.length) return [];

    const userIds = users.map((u) => u.id);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const tickets = await this.prisma.oTTicket.findMany({
      where: {
        userId: { in: userIds },
        status: { in: [OTTicketStatus.COMPLETED, OTTicketStatus.VERIFIED] },
        workDate: { gte: start, lte: end },
      },
    });

    const summaryMap = new Map<string, { totalHours: number; total: number }>();

    for (const t of tickets) {
      const existing = summaryMap.get(t.userId);
      if (existing) {
        existing.totalHours += t.actualHours ?? 0;
        existing.total += 1;
      } else {
        summaryMap.set(t.userId, { totalHours: t.actualHours ?? 0, total: 1 });
      }
    }

    return [...summaryMap.entries()].map(([userId, summary], i) => {
      const user = userMap.get(userId);
      return {
        stt: i + 1,
        userCode: user?.code ?? '',
        fullName: user?.fullName ?? '',
        totalHours: summary.totalHours,
        total: summary.total,
      };
    });
  }
}
