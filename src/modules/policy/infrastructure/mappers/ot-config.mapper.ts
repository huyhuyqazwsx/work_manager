import { OTConfig as PrismaOTConfig } from '@prisma/client';
import { OTConfig } from '@domain/entities/ot-config.entity';

export class OTConfigMapper {
  static toDomain(raw: PrismaOTConfig): OTConfig {
    return new OTConfig(
      raw.id,
      raw.maxHoursPerDay,
      raw.maxHoursPerMonth,
      raw.maxHoursPerYear,
      raw.isActive,
    );
  }

  static toPersistence(
    entity: OTConfig | Partial<OTConfig>,
  ): Record<string, any> {
    return { ...entity };
  }
}
