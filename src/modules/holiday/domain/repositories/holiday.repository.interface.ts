import { IBaseRepository } from '../../../../domain/repositories/base.repository';
import { Holiday } from '../../../../domain/entities/holiday.entity';
import { HolidayType } from '../../../../domain/enum/enum';

export interface IHolidayRepository extends IBaseRepository<Holiday> {
  // Query
  findByYear(year: number): Promise<Holiday[]>;
  findByMonth(year: number, month: number): Promise<Holiday[]>;
  findByType(type: HolidayType): Promise<Holiday[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Holiday[]>;
  findRecurring(): Promise<Holiday[]>;
  findUpcoming(limit?: number): Promise<Holiday[]>;

  // Check
  existsByDate(date: Date): Promise<boolean>;
  isHoliday(date: Date): Promise<boolean>;
  findByDate(date: Date): Promise<Holiday | null>;

  findCompensatoryNearDate(
    originalId: string,
    targetDate: Date,
  ): Promise<Holiday | null>;
}
