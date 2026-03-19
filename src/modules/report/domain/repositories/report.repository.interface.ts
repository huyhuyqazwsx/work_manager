import { LeaveRequestStatus } from '@domain/enum/enum';
import { GetLeaveReportDto } from '@modules/report/application/dto/get-leave-report.dto';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';
import { GetOTPlanReportDto } from '@modules/report/application/dto/get-ot-plan-report.dto';
import { OTPlan } from '@domain/entities/ot-plan.entity';

export interface LeaveRequestRaw {
  id: string;
  createdBy: string;
  leaveTypeCode: string;
  fromDate: Date;
  toDate: Date;
  fromSession: string;
  toSession: string;
  paidDays: number;
  unpaidDays: number;
  totalDays: number;
  status: LeaveRequestStatus;
}

export interface HolidayRaw {
  date: Date;
  session: string;
}

export interface IReportRepository {
  findApprovedLeaveByMonth(
    month: number,
    year: number,
  ): Promise<LeaveRequestRaw[]>;

  findApprovedPaidLeaveByYear(year: number): Promise<LeaveRequestRaw[]>;

  getLeaveRangeBoundaryAll(
    month: number,
    year: number,
  ): Promise<{ minDate: Date | null; maxDate: Date | null }>;

  findHolidaysByMonth(month: number, year: number): Promise<HolidayRaw[]>;

  getLeaveReport(dto: GetLeaveReportDto): Promise<PaginatedLeaveRequests>;

  getOTPlanReport(dto: GetOTPlanReportDto): Promise<{
    data: OTPlan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
}
