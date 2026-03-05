import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { CompensationBalance } from '@domain/entities/compensation_balance.entity';
import { ICompensationService } from '@modules/compensation/application/interfaces/compensation.service.interface';
import * as compensationRepositoryInterface from '@modules/compensation/domain/repositories/compensation.repository.interface';
import { randomUUID } from 'node:crypto';

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

  async getBalanceByUserId(userId: string): Promise<CompensationBalance> {
    const balance =
      await this.compensationRepository.findBalanceByUserId(userId);

    if (!balance) {
      const newBalance = new CompensationBalance(randomUUID(), userId, 0);
      await this.compensationRepository.save(newBalance);
      return newBalance;
    }

    return balance;
  }

  async earnHours(userId: string, hours: number): Promise<CompensationBalance> {
    if (hours <= 0) {
      throw new BadRequestException('Hours must be greater than 0');
    }

    const balance = await this.getBalanceByUserId(userId);
    balance.addHours(hours);
    await this.compensationRepository.save(balance);
    return balance;
  }

  async deductHours(
    userId: string,
    hours: number,
  ): Promise<CompensationBalance> {
    if (hours <= 0) {
      throw new BadRequestException('Hours must be greater than 0');
    }

    const balance = await this.getBalanceByUserId(userId);

    if (!balance.canDeduct(hours)) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${balance.getBalance()}h, Required: ${hours}h`,
      );
    }

    balance.deductHours(hours);
    await this.compensationRepository.save(balance);
    return balance;
  }
}
