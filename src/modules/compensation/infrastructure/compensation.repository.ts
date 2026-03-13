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
import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';

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
    userCode: string,
    targetYear: number,
    tx?: PrismaTransactionClient,
  ): Promise<CompensationBalance | null> {
    const raw = await this.getModel(tx).findFirst({
      where: { userCode, year: targetYear },
    });

    return raw ? CompensationBalanceMapper.toDomain(raw) : null;
  }
}
