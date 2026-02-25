import { Controller, Get, Inject } from '@nestjs/common';
import { Holiday } from '@prisma/client';
import * as holidayServiceInterface from '../../application/interfaces/holiday.service.interface';

@Controller('holiday')
export class HolidayController {
  constructor(
    @Inject('IHolidayService')
    private holidayService: holidayServiceInterface.IHolidayService,
  ) {}

  @Get()
  async findAll(): Promise<Holiday[]> {
    return await this.holidayService.findAll();
  }
}
