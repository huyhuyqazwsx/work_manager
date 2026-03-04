import { Injectable } from '@nestjs/common';
import { PaidPersonalLeaveEvent as PrismaPaidPersonalLeaveEvent } from '@prisma/client';
import { PaidPersonalEventCode } from '@domain/enum/enum';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { PaidPersonalLeaveEvent } from '@domain/entities/paid-personal-leave-event.entity';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { PaidPersonalLeaveEventMapper } from '../mappers/paid-personal-leave-event.mapper';

@Injectable()
export class PrismaPaidPersonalLeaveEventRepository extends BasePrismaRepository<
  PaidPersonalLeaveEvent,
  PrismaPaidPersonalLeaveEvent
> {
  constructor(private readonly prisma: PrismaService) {
    super(
      prisma.paidPersonalLeaveEvent as unknown as PrismaDelegate<PrismaPaidPersonalLeaveEvent>,
      PaidPersonalLeaveEventMapper,
    );
  }

  async findByCode(
    code: PaidPersonalEventCode,
  ): Promise<PaidPersonalLeaveEvent | null> {
    const raw: PrismaPaidPersonalLeaveEvent | null =
      await this.prisma.paidPersonalLeaveEvent.findUnique({
        where: { code },
      });
    return raw ? PaidPersonalLeaveEventMapper.toDomain(raw) : null;
  }
}
