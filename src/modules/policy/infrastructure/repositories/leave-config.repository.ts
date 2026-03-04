import { Injectable } from '@nestjs/common';
import { LeaveConfig as PrismaLeaveConfig } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { LeaveConfig } from '@domain/entities/leave-config.entity';
import { LeaveConfigMapper } from '../mappers/leave-config.mapper';
import { ContractType } from '@domain/enum/enum';

@Injectable()
export class PrismaLeaveConfigRepository extends BasePrismaRepository<
  LeaveConfig,
  PrismaLeaveConfig
> {
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.leaveConfig as unknown as PrismaDelegate<PrismaLeaveConfig>,
      LeaveConfigMapper,
    );
  }

  async findByContractType(
    contractType: ContractType,
  ): Promise<LeaveConfig | null> {
    const raw: PrismaLeaveConfig | null =
      await this.prisma.leaveConfig.findUnique({
        where: { contractType },
      });
    return raw ? LeaveConfigMapper.toDomain(raw) : null;
  }
}
