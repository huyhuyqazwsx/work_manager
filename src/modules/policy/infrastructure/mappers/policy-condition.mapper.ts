import { PolicyCondition as PrismaPolicyCondition } from '@prisma/client';
import { UserRole, ContractType } from '../../../../domain/enum/enum';
import { PolicyCondition } from '../../../../domain/entities/policy_condition.entity';

export class PolicyConditionMapper {
  static toDomain(raw: PrismaPolicyCondition): PolicyCondition {
    return new PolicyCondition(
      raw.id,
      raw.policyId,
      raw.minYear ?? null,
      raw.maxYear ?? null,
      raw.departmentId ?? null,
      (raw.role as UserRole) ?? null,
      (raw.contractType as ContractType) ?? null,
      raw.applyYear ?? null,
    );
  }

  static toPersistence(condition: PolicyCondition): Record<string, any> {
    return {
      id: condition.id,
      policyId: condition.policyId,
      minYear: condition.minYear,
      maxYear: condition.maxYear,
      departmentId: condition.departmentId,
      role: condition.role,
      contractType: condition.contractType,
      applyYear: condition.applyYear,
    };
  }
}
