import { LeaveType as PrismaLeaveType } from '@prisma/client';
import { LeaveType } from '../../../domain/entities/leave_type.entity';

export class LeaveTypeMapper {
  static toDomain(raw: PrismaLeaveType): LeaveType {
    return new LeaveType(
      raw.id,
      raw.code,
      raw.name,
      raw.isPaid,
      raw.deductCompensation,
      raw.createdAt,
    );
  }

  static toPersistence(
    leave_type: LeaveType | Partial<LeaveType>,
  ): Record<string, any> {
    return {
      ...leave_type,
    };
  }
}
