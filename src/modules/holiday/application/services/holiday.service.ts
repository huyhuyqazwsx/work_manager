import { Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../../../infrastructure/crudservice/base-crud.service';
import { Holiday } from '../../../../domain/entities/holiday.entity';
import { IHolidayService } from '../interfaces/holiday.service.interface';
import * as holidayRepositoryInterface from '../../domain/repositories/holiday.repository.interface';

@Injectable()
export class HolidayService
  extends BaseCrudService<Holiday>
  implements IHolidayService
{
  constructor(
    @Inject('IHolidayRepository')
    private holidayRepository: holidayRepositoryInterface.IHolidayRepository,
  ) {
    super(holidayRepository);
  }
}
