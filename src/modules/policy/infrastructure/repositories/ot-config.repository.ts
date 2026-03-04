import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { OTConfig } from '@domain/entities/ot-config.entity';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { OTConfigMapper } from '../mappers/ot-config.mapper';
import { OTConfig as PrismaOTConfig } from '@prisma/client';

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

  async findActive(): Promise<OTConfig | null> {
    const raw = await this.prisma.oTConfig.findFirst({
      where: { isActive: true },
    });
    return raw ? OTConfigMapper.toDomain(raw) : null;
  }
}
