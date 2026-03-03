import { Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../../../infrastructure/crudservice/base-crud.service';
import * as compensationRepositoryInterface from '../../domain/repositories/compensation.repository.interface';
import { CompensationBalance } from '../../../../domain/entities/compensation_balance.entity';
import { ICompensationService } from '../interfaces/compensation.service.interface';

@Injectable()
export class CompensationService
  extends BaseCrudService<CompensationBalance>
  implements ICompensationService
{
  constructor(
    @Inject('ICompensationRepository')
    private compensationRepository: compensationRepositoryInterface.ICompensationRepository,
  ) {
    super(compensationRepository);
  }
}
