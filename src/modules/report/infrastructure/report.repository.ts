import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { LeaveRequestStatus, LeaveTypeCode } from '@domain/enum/enum';
import {
  HolidayRaw,
  IReportRepository,
  LeaveRequestRaw,
} from '@modules/report/domain/repositories/report.repository.interface';

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
}
