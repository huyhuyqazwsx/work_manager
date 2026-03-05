import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { CompensationBalance as PrismaCompensationBalance } from '@prisma/client';
import { CompensationBalance } from '@domain/entities/compensation_balance.entity';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { Injectable } from '@nestjs/common';
import { ICompensationRepository } from '../domain/repositories/compensation.repository.interface';
import { CompensationBalanceMapper } from './compensation.mapper';

@Injectable()
export class PrismaCompensationRepository
  extends BasePrismaRepository<CompensationBalance, PrismaCompensationBalance>
  implements ICompensationRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.compensationBalance as unknown as PrismaDelegate<PrismaCompensationBalance>,
      CompensationBalanceMapper,
    );
  }

  async findBalanceByUserId(
    userId: string,
  ): Promise<CompensationBalance | null> {
    const raw = await this.prismaModel.findUnique({
      where: {
        id: userId,
      },
    });

    return raw ? CompensationBalanceMapper.toDomain(raw) : null;
  }
}
