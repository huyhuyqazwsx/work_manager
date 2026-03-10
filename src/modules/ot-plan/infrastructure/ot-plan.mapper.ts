import { OTPlan } from '@domain/entities/ot-plan.entity';
import { Prisma, OTPlan as PrismaOTPlan } from '@prisma/client';
import { OTPlanStatus } from '@domain/enum/enum';

export class OTPlanMapper {
  static toDomain(raw: PrismaOTPlan): OTPlan {
    return new OTPlan(
      raw.id,
      raw.departmentId,
      raw.managerId,
      raw.reason,
      raw.status as OTPlanStatus,
      raw.startDate,
      raw.endDate,
      raw.startTime,
      raw.endTime,
      raw.userIds,
      raw.rejectedBy ?? null,
      raw.rejectionNote ?? null,
      raw.approvedBy ?? null,
      [], // tickets không được lưu trong plan — load riêng khi cần
      raw.createdAt,
      raw.updatedAt,
      raw.rejectedAt ?? undefined,
      raw.approvedAt ?? undefined,
    );
  }

  static toPersistence(
    entity: OTPlan | Partial<OTPlan>,
  ): Prisma.OTPlanUncheckedCreateInput {
    return {
      id: entity.id,
      departmentId: entity.departmentId!,
      managerId: entity.managerId!,
      reason: entity.reason!,
      status: entity.status,
      startDate: entity.startDate!,
      endDate: entity.endDate!,
      startTime: entity.startTime!,
      endTime: entity.endTime!,
      userIds: entity.userIds ?? [],
      rejectedBy: entity.rejectedBy ?? null,
      rejectionNote: entity.rejectionNote ?? null,
      approvedBy: entity.approvedBy ?? null,
      rejectedAt: entity.rejectedAt ?? null,
      approvedAt: entity.approvedAt ?? null,
    };
  }
}
