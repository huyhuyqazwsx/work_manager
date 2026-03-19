import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { CompensationBalance } from '@domain/entities/compensation_balance.entity';
import { ICompensationService } from '@modules/compensation/application/interfaces/compensation.service.interface';
import * as compensationRepositoryInterface from '@modules/compensation/domain/repositories/compensation.repository.interface';
import { randomUUID } from 'node:crypto';
import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';
import { AppError, AppException } from '@domain/errors';

@Injectable()
export class CompensationService
  extends BaseCrudService<CompensationBalance>
  implements ICompensationService
{
  constructor(
    @Inject('ICompensationRepository')
    private readonly compensationRepository: compensationRepositoryInterface.ICompensationRepository,
  ) {
    super(compensationRepository);
  }

  async earnHours(
    userId: string,
    targetYear: number,
    hours: number,
    tx?: PrismaTransactionClient,
  ): Promise<CompensationBalance> {
    if (hours <= 0) {
      throw new AppException(
        AppError.BAD_REQUEST,
        'Hours must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    const balance = await this.getBalanceByUserId(userId, targetYear, tx);
    balance.addHours(hours);
    await this.compensationRepository.update(balance.id, balance, tx);
    return balance;
  }

  async getBalanceByUserId(
    userId: string,
    targetYear: number,
    tx?: PrismaTransactionClient,
  ): Promise<CompensationBalance> {
    const balance = await this.compensationRepository.findBalanceByUserId(
      userId,
      targetYear,
      tx,
    );

    if (!balance) {
      const newBalance = new CompensationBalance(
        randomUUID(),
        userId,
        targetYear,
        0,
      );
      await this.compensationRepository.save(newBalance, tx);
      return newBalance;
    }

    return balance;
  }

  async deductHours(
    userId: string,
    targetYear: number,
    hours: number,
    tx?: PrismaTransactionClient,
  ): Promise<CompensationBalance> {
    if (hours <= 0) {
      throw new AppException(
        AppError.BAD_REQUEST,
        'Hours must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    const balance = await this.getBalanceByUserId(userId, targetYear, tx);

    if (!balance.canDeduct(hours)) {
      throw new AppException(
        AppError.BAD_REQUEST,
        `Insufficient balance. Available: ${balance.getBalance()}h, Required: ${hours}h`,
        HttpStatus.BAD_REQUEST,
      );
    }

    balance.deductHours(hours);
    await this.compensationRepository.update(balance.id, balance, tx);
    return balance;
  }
}
