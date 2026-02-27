// policy/infrastructure/repository/policy.repository.ts
import { Injectable } from '@nestjs/common';
import {
  Policy as PrismaPolicy,
  PolicyCondition as PrismaPolicyCondition,
  LeavePolicyValue as PrismaLeavePolicyValue,
} from '@prisma/client';
import { PolicyMapper } from './mappers/policy.mapper';
import { PolicyConditionMapper } from './mappers/policy-condition.mapper';
import { LeavePolicyValueMapper } from './mappers/leave-policy-value.mapper';
import { IPolicyRepository } from '../domain/repositories/policy.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/PrismaService';
import { Policy } from '../../../domain/entities/policy.entity';
import { PolicyCondition } from '../../../domain/entities/policy_condition.entity';
import { LeavePolicyValue } from '../../../domain/entities/leave_policy_value.entity';
import { ContractType, UserRole } from '../../../domain/enum/enum';

@Injectable()
export class PrismaPolicyRepository implements IPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Policy | null> {
    const raw: PrismaPolicy | null = await this.prisma.policy.findUnique({
      where: { id },
    });
    return raw ? PolicyMapper.toDomain(raw) : null;
  }

  async findAllActive(): Promise<Policy[]> {
    const records: PrismaPolicy[] = await this.prisma.policy.findMany({
      where: { isActive: true },
    });
    return records.map((r) => PolicyMapper.toDomain(r));
  }

  async findConditionsByPolicyId(policyId: string): Promise<PolicyCondition[]> {
    const records: PrismaPolicyCondition[] =
      await this.prisma.policyCondition.findMany({
        where: { policyId },
      });
    return records.map((r) => PolicyConditionMapper.toDomain(r));
  }

  async findLeavePolicyValue(
    policyId: string,
    leaveTypeId: string,
  ): Promise<LeavePolicyValue | null> {
    const raw: PrismaLeavePolicyValue | null =
      await this.prisma.leavePolicyValue.findFirst({
        where: { policyId, leaveTypeId },
      });
    return raw ? LeavePolicyValueMapper.toDomain(raw) : null;
  }

  async findMatchingLeavePolicyValue(params: {
    leaveTypeId: string;
    contractType: string;
    yearsOfService: number;
    role: string;
    departmentId?: string;
    targetYear: number;
  }): Promise<LeavePolicyValue | null> {
    const policies: PrismaPolicy[] = await this.prisma.policy.findMany({
      where: {
        leaveTypeId: params.leaveTypeId,
        isActive: true,
        type: 'LEAVE',
      },
      orderBy: { priority: 'desc' },
    });

    for (const policy of policies) {
      const conditions = await this.findConditionsByPolicyId(policy.id);

      const allMatch =
        conditions.length === 0 ||
        conditions.every(
          (
            cond, // ← cond typed as PolicyCondition
          ) =>
            cond.matches({
              yearsOfService: params.yearsOfService,
              role: params.role as UserRole, // cast rõ ràng
              contractType: params.contractType as ContractType,
              departmentId: params.departmentId,
              applyYear: params.targetYear,
            }),
        );

      if (!allMatch) continue;

      const policyValue = await this.findLeavePolicyValue(
        policy.id,
        params.leaveTypeId,
      );
      if (policyValue) return policyValue;
    }

    return null;
  }
}
