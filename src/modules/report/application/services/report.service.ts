import { Inject, Injectable } from '@nestjs/common';
import { IReportService } from '../interfaces/report.service.interface';
import * as reportRepositoryInterface from '../../domain/repositories/report.repository.interface';
import * as departmentServiceInterface from '@modules/department/application/interfaces/department.service.interface';
import * as userRepositoryInterface from '@modules/user/domain/repositories/user.repository.interface';
import * as policyServiceInterface from '@modules/policy/application/interfaces/policy.service.interface';
import { HolidaySession, LeaveTypeCode } from '@domain/enum/enum';
import {
  DayCell,
  LeaveMonthlyReportDto,
  LeaveMonthlyRowDto,
} from '@modules/report/application/dto/leave-monthly-report';
import { LeaveRequestRaw } from '../../domain/repositories/report.repository.interface';
import {
  LeaveYearlyReportDto,
  LeaveYearlyRowDto,
} from '../dto/leave-yearly-report';
import * as holidayRepositoryInterface from '@modules/holiday/domain/repositories/holiday.repository.interface';

const DAY_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
type DayFlag =
  | 'WEEKEND'
  | 'HOLIDAY_FULL'
  | 'HOLIDAY_MORNING'
  | 'HOLIDAY_AFTERNOON';

@Injectable()
export class ReportService implements IReportService {
  // private readonly logger = new Logger('ReportService');
  constructor(
    @Inject('IReportRepository')
    private readonly reportRepository: reportRepositoryInterface.IReportRepository,
    @Inject('IDepartmentService')
    private readonly departmentService: departmentServiceInterface.IDepartmentService,
    @Inject('IUserRepository')
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    @Inject('IPolicyService')
    private readonly policyService: policyServiceInterface.IPolicyService,
    @Inject('IHolidayRepository')
    private readonly holidayRepository: holidayRepositoryInterface.IHolidayRepository,
  ) {}

  async getLeaveYearlyReportAll(year: number): Promise<LeaveYearlyReportDto> {
    const startOfYear = new Date(year, 0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const [departments, allUsers, leaveRequests] = await Promise.all([
      this.departmentService.findAll(),
      this.userRepository.findAll(),
      this.reportRepository.findApprovedPaidLeaveByYear(year),
    ]);

    // Group users theo departmentId
    const usersByDept = new Map<string, typeof allUsers>();
    for (const user of allUsers) {
      const list = usersByDept.get(user.departmentId) ?? [];
      list.push(user);
      usersByDept.set(user.departmentId, list);
    }

    // Group leave requests theo userId
    const leaveByUser = new Map<string, LeaveRequestRaw[]>();
    for (const req of leaveRequests) {
      const list = leaveByUser.get(req.createdBy) ?? [];
      list.push(req);
      leaveByUser.set(req.createdBy, list);
    }

    const allRows: LeaveYearlyRowDto[] = [];
    let stt = 1;

    for (const department of departments) {
      const deptUsers = usersByDept.get(department.id) ?? [];

      const rows = await Promise.all(
        deptUsers.map(async (user) => {
          const userLeaves = leaveByUser.get(user.id) ?? [];

          let totalAllowedDays: number;
          try {
            const leaveConfig = await this.policyService.getLeaveConfig(
              user.contractType,
            );

            totalAllowedDays = leaveConfig.calculateAllowedDays({
              signDate: user.joinDate,
              targetYear: year,
            });
          } catch {
            totalAllowedDays = 0;
          }

          const monthlyUsed: Record<number, number> = {};
          for (let m = 1; m <= 12; m++) monthlyUsed[m] = 0;

          for (const req of userLeaves) {
            const reqStart = new Date(req.fromDate);
            reqStart.setHours(0, 0, 0, 0);
            const reqEnd = new Date(req.toDate);
            reqEnd.setHours(23, 59, 59, 999);

            // Đơn hoàn toàn trong năm → cộng thẳng
            if (reqStart >= startOfYear && reqEnd <= endOfYear) {
              const targetMonth = reqStart.getMonth() + 1;
              monthlyUsed[targetMonth] = parseFloat(
                (monthlyUsed[targetMonth] + req.paidDays).toFixed(2),
              );
              continue;
            }

            // Đơn giao năm → duyệt từng ngày
            let remainingPaid = req.paidDays;

            // start trước năm → trừ paid cho các ngày trước startOfYear
            if (reqStart < startOfYear) {
              remainingPaid = this.consumePaidBeforeThreshold(
                req,
                reqStart,
                reqEnd,
                startOfYear,
                remainingPaid,
              );
              if (remainingPaid <= 0) continue;
            }

            // end sau năm → trừ paid cho các ngày sau endOfYear
            if (reqEnd > endOfYear) {
              const paidAfter = this.countWorkDaysAfterThreshold(
                req,
                reqStart,
                reqEnd,
                endOfYear,
              );
              remainingPaid = Math.max(0, remainingPaid - paidAfter);
              if (remainingPaid <= 0) continue;
            }

            // Phần còn lại thuộc năm target
            const targetMonth =
              reqStart < startOfYear ? 1 : reqStart.getMonth() + 1;
            monthlyUsed[targetMonth] = parseFloat(
              (monthlyUsed[targetMonth] + remainingPaid).toFixed(2),
            );
          }

          const totalUsed = parseFloat(
            Object.values(monthlyUsed)
              .reduce((sum, v) => sum + v, 0)
              .toFixed(2),
          );
          const remaining = parseFloat(
            Math.max(0, totalAllowedDays - totalUsed).toFixed(2),
          );

          return {
            stt: stt++,
            userCode: user.code!,
            fullName: user.fullName,
            contractType: user.contractType,
            joinDate: user.joinDate,
            contractSignedDate: user.contractSignedDate,
            employmentStatus: 'HDLD',
            departmentName: department.name,
            totalAllowedDays,
            monthlyUsed,
            totalUsed,
            remaining,
          };
        }),
      );

      allRows.push(...rows);
    }

    return { year, rows: allRows };
  }

  async getLeaveMonthlyReportAll(
    month: number,
    year: number,
  ): Promise<LeaveMonthlyReportDto> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 1 query lấy tất cả departments + users
    const departments = await this.departmentService.findAll();
    const allUsers = await this.userRepository.findAll();

    // 1 query lấy tất cả leave requests của tháng
    const [allLeaveRequests, { minDate, maxDate }] = await Promise.all([
      this.reportRepository.findApprovedLeaveByMonth(month, year),
      this.reportRepository.getLeaveRangeBoundaryAll(month, year),
    ]);

    // Build dayFlagMap 1 lần cho toàn bộ
    const dayFlagMap = new Map<string, DayFlag>();

    if (minDate && maxDate) {
      const rangeStart = new Date(
        Math.min(minDate.getTime(), monthStart.getTime()),
      );
      const rangeEnd = new Date(
        Math.max(maxDate.getTime(), monthEnd.getTime()),
      );

      const holidays = await this.holidayRepository.findByDateRange(
        rangeStart,
        rangeEnd,
      );

      this.fillFlagMap(dayFlagMap, rangeStart, rangeEnd, holidays);
    }

    // Group leave requests theo userId
    const leaveByUser = new Map<string, LeaveRequestRaw[]>();
    for (const req of allLeaveRequests) {
      const list = leaveByUser.get(req.createdBy) ?? [];
      list.push(req);
      leaveByUser.set(req.createdBy, list);
    }

    // Group users theo departmentId
    const usersByDept = new Map<string, typeof allUsers>();
    for (const user of allUsers) {
      const list = usersByDept.get(user.departmentId) ?? [];
      list.push(user);
      usersByDept.set(user.departmentId, list);
    }

    // Build rows theo thứ tự department
    const allRows: LeaveMonthlyRowDto[] = [];
    let stt = 1;

    for (const department of departments) {
      const deptUsers = usersByDept.get(department.id) ?? [];

      deptUsers.forEach((user) => {
        const userLeaves = leaveByUser.get(user.id) ?? [];
        let totalLeave = 0;
        let totalHoliday = 0;
        let totalUnpaid = 0;

        const daySymbolMap = new Map<string, string>();

        for (const req of userLeaves) {
          let remainingPaid = req.paidDays;

          const reqStart = new Date(req.fromDate);
          reqStart.setHours(0, 0, 0, 0);
          const reqEnd = new Date(req.toDate);
          reqEnd.setHours(23, 59, 59, 999);

          const cursor = new Date(reqStart);

          while (cursor <= reqEnd) {
            const dateStr = cursor.toDateString();
            const flag = dayFlagMap.get(dateStr);

            const isFirstDay =
              cursor.toDateString() === reqStart.toDateString();
            const isLastDay = cursor.toDateString() === reqEnd.toDateString();
            const isHalf =
              (isFirstDay &&
                (req.fromSession as HolidaySession) ===
                  HolidaySession.AFTERNOON) ||
              (isLastDay &&
                (req.toSession as HolidaySession) === HolidaySession.MORNING);
            const dayValue = isHalf ? 0.5 : 1;

            if (flag === 'WEEKEND') {
              // bỏ qua
            } else if (flag === 'HOLIDAY_FULL') {
              daySymbolMap.set(dateStr, 'NL');
              totalHoliday += 1;
            } else if (
              flag === 'HOLIDAY_MORNING' ||
              flag === 'HOLIDAY_AFTERNOON'
            ) {
              if (!daySymbolMap.has(dateStr)) {
                daySymbolMap.set(dateStr, 'NL/2');
              }
              totalHoliday += 0.5;
              if (remainingPaid > 0) {
                totalLeave += 0.5;
                remainingPaid -= 0.5;
              } else {
                totalUnpaid += 0.5;
              }
            } else {
              const existing = daySymbolMap.get(dateStr);
              if (remainingPaid > 0) {
                const symbol = this.resolveSymbol(req.leaveTypeCode, isHalf);
                if (existing && existing.endsWith('/2')) {
                  daySymbolMap.set(dateStr, existing.replace('/2', ''));
                } else {
                  daySymbolMap.set(dateStr, symbol);
                }
                totalLeave += dayValue;
                remainingPaid -= dayValue;
              } else {
                if (existing && existing.endsWith('/2')) {
                  daySymbolMap.set(dateStr, existing.replace('/2', ''));
                } else {
                  daySymbolMap.set(dateStr, isHalf ? 'KL/2' : 'KL');
                }
                totalUnpaid += dayValue;
              }
            }

            cursor.setDate(cursor.getDate() + 1);
          }
        }

        const days: DayCell[] = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(year, month - 1, i + 1);
          const dow = date.getDay();
          const isWeekend = dow === 0 || dow === 6;
          const symbol = daySymbolMap.get(date.toDateString()) ?? null;

          return {
            day: i + 1,
            dayOfWeek: DAY_OF_WEEK[dow],
            isWeekend,
            symbol,
          };
        });

        allRows.push({
          stt: stt++,
          userCode: user.code!,
          fullName: user.fullName,
          contractType: user.contractType,
          joinDate: user.joinDate,
          contractSignedDate: user.contractSignedDate,
          departmentName: department.name,
          days,
          totalLeave,
          totalHoliday,
          totalUnpaid,
        });
      });
    }

    return { month, year, rows: allRows };
  }

  // ===== Private helpers =====

  private resolveSymbol(leaveTypeCode: string, isHalfDay: boolean): string {
    switch (leaveTypeCode as LeaveTypeCode) {
      case LeaveTypeCode.ANNUAL:
        return isHalfDay ? 'P/2' : 'P';
      case LeaveTypeCode.COMPENSATORY:
        return isHalfDay ? 'NCD/2' : 'NCD';
      case LeaveTypeCode.PAID_PERSONAL:
        return isHalfDay ? 'NCD/2' : 'NCD';
      case LeaveTypeCode.SOCIAL_INSURANCE:
        return 'BHXH';
      default:
        return isHalfDay ? 'KL/2' : 'KL';
    }
  }

  private fillFlagMap(
    map: Map<string, DayFlag>,
    from: Date,
    to: Date,
    holidays: { date: Date; session: string }[],
  ): void {
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      const dow = cursor.getDay();
      if (dow === 0 || dow === 6) {
        map.set(cursor.toDateString(), 'WEEKEND');
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const holidayByDate = new Map<string, Set<string>>();
    for (const h of holidays) {
      const dateStr = h.date.toDateString();
      if (map.get(dateStr) === 'WEEKEND') continue;
      const sessions = holidayByDate.get(dateStr) ?? new Set<string>();
      sessions.add(h.session);
      holidayByDate.set(dateStr, sessions);
    }

    for (const [dateStr, sessions] of holidayByDate) {
      if (
        sessions.has(HolidaySession.FULL) ||
        (sessions.has(HolidaySession.MORNING) &&
          sessions.has(HolidaySession.AFTERNOON))
      ) {
        map.set(dateStr, 'HOLIDAY_FULL');
      } else if (sessions.has(HolidaySession.MORNING)) {
        map.set(dateStr, 'HOLIDAY_MORNING');
      } else if (sessions.has(HolidaySession.AFTERNOON)) {
        map.set(dateStr, 'HOLIDAY_AFTERNOON');
      }
    }
  }

  private consumePaidBeforeThreshold(
    req: LeaveRequestRaw,
    reqStart: Date,
    reqEnd: Date,
    threshold: Date,
    remainingPaid: number,
  ): number {
    const cursor = new Date(reqStart);

    while (cursor < threshold && remainingPaid > 0) {
      const dow = cursor.getDay();

      if (dow !== 0 && dow !== 6) {
        const isFirstDay = cursor.toDateString() === reqStart.toDateString();
        const isLastDay = cursor.toDateString() === reqEnd.toDateString();
        const isHalf =
          (isFirstDay &&
            (req.fromSession as HolidaySession) === HolidaySession.AFTERNOON) ||
          (isLastDay &&
            (req.toSession as HolidaySession) === HolidaySession.MORNING);
        remainingPaid -= isHalf ? 0.5 : 1;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return Math.max(0, remainingPaid);
  }

  // Đếm ngày làm việc sau threshold (ví dụ endOfYear)
  private countWorkDaysAfterThreshold(
    req: LeaveRequestRaw,
    reqStart: Date,
    reqEnd: Date,
    threshold: Date,
  ): number {
    const cursor = new Date(threshold.getTime() + 1);
    cursor.setHours(0, 0, 0, 0);
    let workDays = 0;

    while (cursor <= reqEnd) {
      const dow = cursor.getDay();
      const isWeekend = dow === 0 || dow === 6;

      if (!isWeekend) {
        const isFirstDay = cursor.toDateString() === reqStart.toDateString();
        const isLastDay = cursor.toDateString() === reqEnd.toDateString();
        const isHalf =
          (isFirstDay &&
            (req.fromSession as HolidaySession) === HolidaySession.AFTERNOON) ||
          (isLastDay &&
            (req.toSession as HolidaySession) === HolidaySession.MORNING);
        workDays += isHalf ? 0.5 : 1;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return workDays;
  }
}
