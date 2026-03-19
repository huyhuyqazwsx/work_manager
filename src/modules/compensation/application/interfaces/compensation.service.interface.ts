import { CompensationBalance } from '@domain/entities/compensation_balance.entity';
import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';

export interface ICompensationService extends IBaseCrudService<CompensationBalance> {
  getBalanceByUserId(
    userId: string,
    targetYear: number,
    tx?: unknown,
  ): Promise<CompensationBalance>;
  earnHours(
    userId: string,
    targetYear: number,
    hours: number,
    tx?: unknown,
  ): Promise<CompensationBalance>;
  deductHours(
    userId: string,
    targetYear: number,
    hours: number,
    tx?: unknown,
  ): Promise<CompensationBalance>;
}
