import { IBaseRepository } from '../../../../domain/repositories/base.repository';
import { Holiday } from '../../../../domain/entities/holiday.entity';

export interface IHolidayRepository extends IBaseRepository<Holiday> {}