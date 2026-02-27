import { LeavePolicyValue } from '../../../../domain/entities/leave_policy_value.entity';

export interface IPolicyService {
  findMatchingLeavePolicyValue(params: {
    leaveTypeId: string;
    contractType: string;
    yearsOfService: number;
    role: string;
    departmentId?: string;
    targetYear: number;
  }): Promise<LeavePolicyValue | null>;
}
