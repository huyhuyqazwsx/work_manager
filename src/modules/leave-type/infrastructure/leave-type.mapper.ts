import { LeaveType as PrismaLeaveType } from '@prisma/client';
import { LeaveType } from '../../../domain/entities/leave_type.entity';
import { LeaveTypeCode } from '../../../domain/enum/enum';

export class LeaveTypeMapper {
  static toDomain(raw: PrismaLeaveType): LeaveType {
    return new LeaveType(
      raw.id,
      raw.code as LeaveTypeCode,
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
