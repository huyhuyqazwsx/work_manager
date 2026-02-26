import { IBaseCrudService } from '../../../../domain/crudservice/base-crud.service.interface';
import { Holiday } from '../../../../domain/entities/holiday.entity';
import { HolidayType } from '../../../../domain/enum/enum';

export interface IHolidayService extends IBaseCrudService<Holiday> {
  // Query
  findByYear(year: number): Promise<Holiday[]>;
  findByMonth(year: number, month: number): Promise<Holiday[]>;
  findByType(type: HolidayType): Promise<Holiday[]>;
  findUpcoming(limit?: number): Promise<Holiday[]>;

  // Check
  isHoliday(date: Date): Promise<boolean>;
  getHolidayByDate(date: Date): Promise<Holiday | null>;

  //Auto generate recurring holidays
  generateRecurringHolidays(year: number): Promise<{
    generated: number;
    compensated: number;
  }>;

  getTotalDaysInYear(year: number): Promise<{
    regularHolidays: number;
    compensatoryHolidays: number;
    total: number;
  }>;

  countWeekendDays(startDate: Date, endDate: Date): number;

  calculateLeaveDays(
    fromDate: Date,
    toDate: Date,
  ): Promise<{
    totalCalendarDays: number;
    weekendDays: number;
    holidayDays: number;
    compensatoryDays: number;
    actualLeaveDays: number;
  }>;
}
