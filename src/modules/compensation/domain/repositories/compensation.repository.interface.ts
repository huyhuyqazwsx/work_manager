import { CompensationBalance } from '@domain/entities/compensation_balance.entity';
import { IBaseRepository } from '@domain/repositories/base.repository';

export interface ICompensationRepository extends IBaseRepository<CompensationBalance> {}
