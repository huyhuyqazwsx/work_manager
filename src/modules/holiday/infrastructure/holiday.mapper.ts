import { Holiday } from '../../../domain/entities/holiday.entity';

import { Holiday as PrismaHoliday } from '@prisma/client';
import { HolidaySession, HolidayType } from '../../../domain/enum/enum';

export class HolidayMapper {
  static toDomain(raw: PrismaHoliday): Holiday {
    return new Holiday(
      raw.id,
      raw.name,
      raw.date,
      raw.type as HolidayType,
      raw.session as HolidaySession,
      raw.isRecurring,
      raw.createdBy,
      raw.createdAt,
    );
  }

  static toPersistence(
    holiday: Holiday | Partial<Holiday>,
  ): Record<string, any> {
    return {
      ...holiday,
    };
  }
}
