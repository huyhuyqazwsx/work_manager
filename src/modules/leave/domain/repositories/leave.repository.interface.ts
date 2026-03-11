import { IBaseRepository } from '@domain/repositories/base.repository';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';

export interface ILeaveRequestRepository extends IBaseRepository<LeaveRequest> {
  getByUserId(userId: string): Promise<LeaveRequest[]>;
  getLeaveRequestByManagerId(
    managerId: string,
    departmentId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLeaveRequests>;
  calculatorUsedDay(targetYear: number, leaveTypeId: string): Promise<number>;
}
