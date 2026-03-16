import { IBaseRepository } from '@domain/repositories/base.repository';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';
import { RangeExistDto } from '@modules/leave/application/dto/range-exist.dto';

export interface ILeaveRequestRepository extends IBaseRepository<LeaveRequest> {
  getByUserId(userId: string): Promise<LeaveRequest[]>;
  getLeaveRequestByManagerId(
    managerId: string,
    departmentId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLeaveRequests>;
  getMyLeaveRequests(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLeaveRequests>;
  calculatorUsedDay(
    userId: string,
    targetYear: number,
    leaveTypeId: string,
  ): Promise<number>;
  getAnnualLeaveSummary(
    userId: string,
    year: number,
  ): Promise<{
    usedPaidDays: number;
    usedUnpaidDays: number;
    totalDays: number;
  }>;
  findOverlapping(
    userId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LeaveRequest[]>;
  getRangeExistLeaveRequest(
    userId: string,
    targetYear: number,
  ): Promise<RangeExistDto>;

  getLeaveRequestByBod(): Promise<LeaveRequest[]>;
}
