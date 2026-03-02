import { Injectable } from '@nestjs/common';
import { OTConfig as PrismaOTConfig } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/PrismaService';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '../../../../infrastructure/repository/base/base-prisma.repository';
import { OTConfig } from '../../../../domain/entities/ot-config.entity';
import { OTConfigMapper } from '../mappers/ot-config.mapper';
import { ContractType } from '../../../../domain/enum/enum';

@Injectable()
export class PrismaOTConfigRepository extends BasePrismaRepository<
  OTConfig,
  PrismaOTConfig
> {
  constructor(private readonly prisma: PrismaService) {
    super(
      prisma.oTConfig as unknown as PrismaDelegate<PrismaOTConfig>,
      OTConfigMapper,
    );
  }

  async findByContractType(
    contractType: ContractType,
  ): Promise<OTConfig | null> {
    const raw: PrismaOTConfig | null = await this.prisma.oTConfig.findUnique({
      where: { contractType },
    });
    return raw ? OTConfigMapper.toDomain(raw) : null;
  }
}
