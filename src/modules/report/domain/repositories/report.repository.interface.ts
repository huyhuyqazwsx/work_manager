import { LeaveRequestStatus } from '@domain/enum/enum';

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
}
