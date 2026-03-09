import { LeaveRequest } from '@domain/entities/leave_request.entity';

export interface PaginatedLeaveRequests {
  data: LeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
