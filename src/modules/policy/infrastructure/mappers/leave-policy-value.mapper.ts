import { LeavePolicyValue as PrismaLeavePolicyValue } from '@prisma/client';
import { LeavePolicyValue } from '../../../../domain/entities/leave_policy_value.entity';

export class LeavePolicyValueMapper {
  static toDomain(raw: PrismaLeavePolicyValue): LeavePolicyValue {
    return new LeavePolicyValue(
      raw.id,
      raw.policyId,
      raw.leaveTypeId,
      raw.maxDaysPerRequest,
      raw.minimumNoticeDays,
      raw.allowNegativeBalance,
      raw.baseDaysPerYear,
      raw.bonusDaysPerCycle,
      raw.bonusYearCycle,
      raw.prorateByMonth,
      raw.joinDateCutoffDay,
      raw.carryOverDays,
      raw.allowedContractTypes,
    );
  }

  static toPersistence(value: LeavePolicyValue): Record<string, any> {
    return {
      id: value.id,
      policyId: value.policyId,
      leaveTypeId: value.leaveTypeId,
      maxDaysPerRequest: value.maxDaysPerRequest,
      minimumNoticeDays: value.minimumNoticeDays,
      allowNegativeBalance: value.allowNegativeBalance,
      baseDaysPerYear: value.baseDaysPerYear,
      bonusDaysPerCycle: value.bonusDaysPerCycle,
      bonusYearCycle: value.bonusYearCycle,
      prorateByMonth: value.prorateByMonth,
      joinDateCutoffDay: value.joinDateCutoffDay,
      carryOverDays: value.carryOverDays,
      allowedContractTypes: value.allowedContractTypes,
    };
  }
}
