import { Policy as PrismaPolicy } from '@prisma/client';
import { PolicyType } from '../../../../domain/enum/enum';
import { Policy } from '../../../../domain/entities/policy.entity';

export class PolicyMapper {
  static toDomain(raw: PrismaPolicy): Policy {
    return new Policy(
      raw.id,
      raw.name,
      raw.type as PolicyType,
      raw.priority,
      raw.isActive,
      raw.leaveTypeId ?? null,
    );
  }

  static toPersistence(policy: Policy): Record<string, any> {
    return {
      id: policy.id,
      name: policy.name,
      type: policy.type,
      priority: policy.priority,
      isActive: policy.isActive,
      leaveTypeId: policy.leaveTypeId,
    };
  }
}
