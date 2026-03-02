import { OTConfig as PrismaOTConfig } from '@prisma/client';
import { ContractType } from '../../../../domain/enum/enum';
import { OTConfig } from '../../../../domain/entities/ot-config.entity';

export class OTConfigMapper {
  static toDomain(raw: PrismaOTConfig): OTConfig {
    return new OTConfig(
      raw.id,
      raw.contractType as ContractType,
      raw.maxHoursPerDay,
      raw.maxHoursPerMonth,
      raw.maxHoursPerYear,
      raw.salaryMultiplier,
      raw.isActive,
    );
  }

  static toPersistence(
    entity: OTConfig | Partial<OTConfig>,
  ): Record<string, any> {
    return { ...entity };
  }
}
