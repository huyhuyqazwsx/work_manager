import { OTPlan } from '@domain/entities/ot-plan.entity';
import { OTPlan as PrismaOTPlan } from '@prisma/client';
import { OTPlanStatus } from '@domain/enum/enum';

export class OTPlanMapper {
  static toDomain(raw: PrismaOTPlan): OTPlan {
    return new OTPlan(
      raw.id,
      raw.departmentId,
      raw.managerId,
      raw.reason,
      raw.status as OTPlanStatus,
      raw.rejectedBy ?? null,
      raw.rejectionNote ?? null,
      raw.approvedBy ?? null,
      [],
      raw.createdAt,
      raw.updatedAt,
      raw.rejectedAt ?? undefined,
      raw.approvedAt ?? undefined,
    );
  }

  static toPersistence(entity: OTPlan | Partial<OTPlan>): Record<string, any> {
    return { ...entity };
  }
}
