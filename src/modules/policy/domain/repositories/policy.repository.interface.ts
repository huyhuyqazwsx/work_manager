import { LeavePolicyValue } from '../../../../domain/entities/leave_policy_value.entity';
import { Policy } from '../../../../domain/entities/policy.entity';
import { PolicyCondition } from '../../../../domain/entities/policy_condition.entity';

export interface IPolicyRepository {
  // --- Policy ---
  findById(id: string): Promise<Policy | null>;
  findAllActive(): Promise<Policy[]>;

  // --- Conditions ---
  findConditionsByPolicyId(policyId: string): Promise<PolicyCondition[]>;

  // --- LeavePolicyValue ---
  findLeavePolicyValue(
    policyId: string,
    leaveTypeId: string,
  ): Promise<LeavePolicyValue | null>;

  // --- Main query: tìm policy value phù hợp nhất ---
  findMatchingLeavePolicyValue(params: {
    leaveTypeId: string;
    contractType: string;
    yearsOfService: number;
    role: string;
    departmentId?: string;
    targetYear: number;
  }): Promise<LeavePolicyValue | null>;
}
