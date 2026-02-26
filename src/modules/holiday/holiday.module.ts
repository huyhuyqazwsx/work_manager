import { Module } from '@nestjs/common';
import { HolidayService } from './application/services/holiday.service';
import { HolidayController } from './presentation/controllers/holiday.controller';
import { PrismaHolidayRepository } from './infrastructure/holiday.repository';

@Module({
  providers: [
    {
      provide: 'IHolidayRepository',
      useClass: PrismaHolidayRepository,
    },
    {
      provide: 'IHolidayService',
      useClass: HolidayService,
    },
  ],
  controllers: [HolidayController],
  exports: ['IHolidayService'],
})
export class HolidayModule {}
