import { CompensationBalance } from '@domain/entities/compensation_balance.entity';
import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';

export interface ICompensationService extends IBaseCrudService<CompensationBalance> {
  getBalanceByUserId(
    userId: string,
    tx?: unknown,
  ): Promise<CompensationBalance>;
  earnHours(
    userId: string,
    hours: number,
    tx?: unknown,
  ): Promise<CompensationBalance>;
  deductHours(
    userId: string,
    hours: number,
    tx?: unknown,
  ): Promise<CompensationBalance>;
}
