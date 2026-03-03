import { IBaseCrudService } from '../../../../domain/crudservice/base-crud.service.interface';
import { CompensationBalance } from '../../../../domain/entities/compensation_balance.entity';

export interface ICompensationService extends IBaseCrudService<CompensationBalance> {}
