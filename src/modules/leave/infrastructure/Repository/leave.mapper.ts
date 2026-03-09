import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { LeaveRequest as PrismaLeaveRequest } from '@prisma/client';
import { HolidaySession, LeaveRequestStatus } from '@domain/enum/enum';

export class LeaveRequestMapper {
  static toDomain(raw: PrismaLeaveRequest): LeaveRequest {
    return new LeaveRequest(
      raw.id,
      raw.leaveTypeId,
      raw.status as LeaveRequestStatus,
      raw.fromDate,
      raw.toDate,
      raw.fromSession as HolidaySession,
      raw.toSession as HolidaySession,
      raw.totalDays,
      raw.reason,
      raw.createdBy,
      raw.approvedBy,
      raw.createdAt,
      raw.approvedAt,
    );
  }

  static toPersistence(
    leaveRequest: LeaveRequest | Partial<LeaveRequest>,
  ): Record<string, any> {
    return {
      ...leaveRequest,
    };
  }
}
