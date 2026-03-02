import { LeaveConfig as PrismaLeaveConfig } from '@prisma/client';
import { ContractType } from '../../../../domain/enum/enum';
import { LeaveConfig } from '../../../../domain/entities/leave-config.entity';

export class LeaveConfigMapper {
  static toDomain(raw: PrismaLeaveConfig): LeaveConfig {
    return new LeaveConfig(
      raw.id,
      raw.contractType as ContractType,
      raw.baseDaysPerYear,
      raw.bonusDaysPerCycle,
      raw.bonusYearCycle,
      raw.maxDaysPerRequest,
      raw.minimumNoticeDays,
      raw.prorateByMonth,
      raw.joinDateCutoffDay,
      raw.carryOverDays,
      raw.allowNegativeBalance,
      raw.isActive,
    );
  }

  static toPersistence(
    entity: LeaveConfig | Partial<LeaveConfig>,
  ): Record<string, any> {
    return { ...entity };
  }
}
