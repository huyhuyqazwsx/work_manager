import { Inject, Injectable } from '@nestjs/common';
import { IPolicyService } from '../interfaces/policy.service.interface';
import * as policyRepositoryInterface from '../../domain/repositories/policy.repository.interface';
import { LeavePolicyValue } from '../../../../domain/entities/leave_policy_value.entity';

@Injectable()
export class PolicyService implements IPolicyService {
  constructor(
    @Inject('IPolicyRepository')
    private readonly policyRepository: policyRepositoryInterface.IPolicyRepository,
  ) {}

  async findMatchingLeavePolicyValue(params: {
    leaveTypeId: string;
    contractType: string;
    yearsOfService: number;
    role: string;
    departmentId?: string;
    targetYear: number;
  }): Promise<LeavePolicyValue | null> {
    return this.policyRepository.findMatchingLeavePolicyValue(params);
  }
}
