import { CompensationBalance as PrismaCompensationBalance } from '@prisma/client';
import { CompensationBalance } from '@domain/entities/compensation_balance.entity';

export class CompensationBalanceMapper {
  static toDomain(raw: PrismaCompensationBalance): CompensationBalance {
    return new CompensationBalance(
      raw.id,
      raw.userCode,
      raw.year,
      raw.hours,
      raw.updatedAt,
    );
  }

  static toPersistence(
    entity: CompensationBalance | Partial<CompensationBalance>,
  ): Record<string, any> {
    return {
      ...entity,
    };
  }
}
