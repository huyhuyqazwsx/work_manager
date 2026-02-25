import { IBaseCrudService } from '../../../../domain/crudservice/base-crud.service.interface';
import { Holiday } from '../../../../domain/entities/holiday.entity';

export interface IHolidayService extends IBaseCrudService<Holiday>{}
