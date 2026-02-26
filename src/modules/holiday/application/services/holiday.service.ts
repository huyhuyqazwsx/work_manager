import { Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../../../infrastructure/crudservice/base-crud.service';
import { Holiday } from '../../../../domain/entities/holiday.entity';
import { IHolidayService } from '../interfaces/holiday.service.interface';
import * as holidayRepositoryInterface from '../../domain/repositories/holiday.repository.interface';
import { HolidayType } from '../../../../domain/enum/enum';
import { randomUUID } from 'node:crypto';

@Injectable()
export class HolidayService
  extends BaseCrudService<Holiday>
  implements IHolidayService
{
  // private readonly logger = new Logger(HolidayService.name);

  constructor(
    @Inject('IHolidayRepository')
    private holidayRepository: holidayRepositoryInterface.IHolidayRepository,
  ) {
    super(holidayRepository);
  }

  async findByYear(year: number): Promise<Holiday[]> {
    return await this.holidayRepository.findByYear(year);
  }

  async findByMonth(year: number, month: number): Promise<Holiday[]> {
    return await this.holidayRepository.findByMonth(year, month);
  }

  async findByType(type: HolidayType): Promise<Holiday[]> {
    return await this.holidayRepository.findByType(type);
  }

  async findUpcoming(limit: number = 10): Promise<Holiday[]> {
    return await this.holidayRepository.findUpcoming(limit);
  }

  async isHoliday(date: Date): Promise<boolean> {
    return await this.holidayRepository.isHoliday(date);
  }

  async getHolidayByDate(date: Date): Promise<Holiday | null> {
    return await this.holidayRepository.findByDate(date);
  }

  async create(entity: Holiday): Promise<void> {
    await this.repository.save(entity);

    if (entity.needsCompensation()) {
      await this.createCompensatoryHoliday(entity);
    }
  }

  private async createCompensatoryHoliday(
    originalHoliday: Holiday,
  ): Promise<void> {
    const compensatoryDate = originalHoliday.getCompensatoryDate();

    const existingCompensatory =
      await this.holidayRepository.findCompensatoryNearDate(
        originalHoliday.id,
        compensatoryDate,
      );

    if (existingCompensatory) {
      return;
    }

    if (existingCompensatory) return;

    const compensatoryHoliday = new Holiday(
      randomUUID(),
      `${originalHoliday.name} (Nghỉ bù)`,
      compensatoryDate,
      originalHoliday.type,
      originalHoliday.session,
      false,
      originalHoliday.createdBy,
      new Date(),
      true,
      originalHoliday.id,
    );

    await this.repository.save(compensatoryHoliday);
  }

  async generateRecurringHolidays(year: number): Promise<{
    generated: number;
    compensated: number;
  }> {
    const recurringHolidays = await this.holidayRepository.findRecurring();
    let generated = 0;
    let compensated = 0;

    for (const holiday of recurringHolidays) {
      const newDate = new Date(holiday.date);
      newDate.setFullYear(year);

      // Check existing
      const existing = await this.holidayRepository.findByDate(newDate);
      if (
        existing &&
        existing.name === holiday.name &&
        existing.type === holiday.type &&
        existing.session === holiday.session
      ) {
        continue;
      }

      // Create new holiday
      const newHoliday = new Holiday(
        randomUUID(),
        holiday.name,
        newDate,
        holiday.type,
        holiday.session,
        holiday.isRecurring,
        holiday.createdBy,
        new Date(),
        false,
        undefined,
      );

      await this.repository.save(newHoliday);
      generated++;

      if (newHoliday.needsCompensation()) {
        await this.createCompensatoryHoliday(newHoliday);
        compensated++;
      }
    }

    return { generated, compensated };
  }

  async getTotalDaysInYear(year: number): Promise<{
    regularHolidays: number;
    compensatoryHolidays: number;
    total: number;
  }> {
    const holidays = await this.holidayRepository.findByYear(year);

    const dateMap = new Map<string, Holiday[]>();

    holidays.forEach((holiday) => {
      const dateKey = this.getDateKey(holiday.date);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(holiday);
    });

    let regularDays = 0;
    let compensatoryDays = 0;

    dateMap.forEach((holidaysOnDate) => {
      // Tính giá trị ngày (xử lý overlap)
      let dailyValue = 0;

      const hasFull = holidaysOnDate.some((h) => h.isFullDay());
      const hasMorning = holidaysOnDate.some((h) => h.isMorning());
      const hasAfternoon = holidaysOnDate.some((h) => h.isAfternoon());

      if (hasFull) {
        dailyValue = 1;
      } else if (hasMorning && hasAfternoon) {
        dailyValue = 1;
      } else if (hasMorning || hasAfternoon) {
        dailyValue = 0.5;
      }

      // Phân loại regular vs compensatory
      const hasCompensatory = holidaysOnDate.some((h) => h.isCompensatory);

      if (hasCompensatory) {
        compensatoryDays += dailyValue;
      } else {
        regularDays += dailyValue;
      }
    });

    const total = regularDays + compensatoryDays;

    return {
      regularHolidays: regularDays,
      compensatoryHolidays: compensatoryDays,
      total,
    };
  }

  countWeekendDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffInMs = end.getTime() - start.getTime();
    const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;

    const fullWeeks = Math.floor(totalDays / 7);
    let weekendDays = fullWeeks * 2;

    const remainingDays = totalDays % 7;

    for (let i = 0; i < remainingDays; i++) {
      const day = (start.getDay() + i) % 7;
      if (day === 0 || day === 6) {
        weekendDays++;
      }
    }

    return weekendDays;
  }

  async calculateLeaveDays(
    fromDate: Date,
    toDate: Date,
  ): Promise<{
    totalCalendarDays: number;
    weekendDays: number;
    holidayDays: number;
    compensatoryDays: number;
    actualLeaveDays: number;
  }> {
    const start = new Date(fromDate);
    const end = new Date(toDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const totalCalendarDays =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const holidays = await this.holidayRepository.findByDateRange(start, end);

    const holidayDateMap = new Map<string, Holiday[]>();

    holidays.forEach((holiday) => {
      const key = this.getDateKey(holiday.date);
      if (!holidayDateMap.has(key)) {
        holidayDateMap.set(key, []);
      }
      holidayDateMap.get(key)!.push(holiday);
    });

    let weekendDays = 0;
    let regularHolidayDays = 0;
    let compensatoryDays = 0;

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateKey = this.getDateKey(current);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holidaysOnDate = holidayDateMap.get(dateKey) || [];

      if (isWeekend) {
        weekendDays++;
      } else if (holidaysOnDate.length > 0) {
        const hasFull = holidaysOnDate.some((h) => h.isFullDay());
        const hasMorning = holidaysOnDate.some((h) => h.isMorning());
        const hasAfternoon = holidaysOnDate.some((h) => h.isAfternoon());

        let dayValue = 0;
        if (hasFull) {
          dayValue = 1.0;
        } else if (hasMorning && hasAfternoon) {
          dayValue = 1.0;
        } else if (hasMorning || hasAfternoon) {
          dayValue = 0.5;
        }

        // Check if any is compensatory
        const hasCompensatory = holidaysOnDate.some((h) => h.isCompensatory);

        if (hasCompensatory) {
          compensatoryDays += dayValue;
        } else {
          regularHolidayDays += dayValue;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    const totalHolidayDays = regularHolidayDays + compensatoryDays;
    const actualLeaveDays = totalCalendarDays - weekendDays - totalHolidayDays;

    return {
      totalCalendarDays,
      weekendDays,
      holidayDays: regularHolidayDays,
      compensatoryDays,
      actualLeaveDays,
    };
  }

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
