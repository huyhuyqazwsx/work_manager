import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import * as holidayServiceInterface from '../../application/interfaces/holiday.service.interface';
import { randomUUID } from 'node:crypto';
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HolidaySession, HolidayType } from '@domain/enum/enum';
import { CreateHolidayDto } from '../../application/dto/create-holiday.dto';
import { UpdateHolidayDto } from '../../application/dto/update-holiday.dto';
import { Holiday } from '@domain/entities/holiday.entity';
import { CreateHolidayResponseDto } from '../../application/dto/response-create-holiday.dto';

@ApiTags('Holidays')
@ApiBearerAuth()
@Controller('holidays')
export class HolidayController {
  constructor(
    @Inject('IHolidayService')
    private holidayService: holidayServiceInterface.IHolidayService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all holidays with filters' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: HolidayType })
  async findAll(
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('type') type?: HolidayType,
  ): Promise<Holiday[]> {
    if (year && month) {
      return await this.holidayService.findByMonth(year, month);
    }

    if (year) {
      return await this.holidayService.findByYear(year);
    }

    if (type) {
      return await this.holidayService.findByType(type);
    }

    return await this.holidayService.findAll();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming holidays' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getUpcoming(@Query('limit') limit?: number): Promise<Holiday[]> {
    return await this.holidayService.findUpcoming(limit);
  }

  @Get('year/:year')
  @ApiOperation({ summary: 'Get all holidays by year' })
  async getByYear(
    @Param('year', ParseIntPipe) year: number,
  ): Promise<Holiday[]> {
    return await this.holidayService.findByYear(year);
  }

  @Get('year/:year/total-days')
  @ApiOperation({
    summary: 'Get total holiday days breakdown in a year',
    description:
      'Returns breakdown of regular holidays vs compensatory holidays. ' +
      'Handles overlapping holidays (takes max value: FULL=1.0, HALF=0.5)',
  })
  async getTotalDays(@Param('year', ParseIntPipe) year: number): Promise<{
    year: number;
    regularHolidays: number;
    compensatoryHolidays: number;
    total: number;
  }> {
    const result = await this.holidayService.getTotalDaysInYear(year);
    return {
      year,
      ...result,
    };
  }

  @Get('weekends/count')
  @ApiOperation({
    summary: 'Count weekend days (Saturday + Sunday) in date range',
  })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-12-31' })
  countWeekends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): {
    startDate: string;
    endDate: string;
    weekendDays: number;
  } {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const weekendDays = this.holidayService.countWeekendDays(start, end);

    return {
      startDate,
      endDate,
      weekendDays,
    };
  }

  @Get('leave-days/calculate')
  @ApiOperation({
    summary: 'Calculate actual leave days (for LeaveRequest)',
    description:
      'Calculates: Total days - Weekends - Holidays (including compensatory). ' +
      'Used when creating leave requests.',
  })
  @ApiQuery({ name: 'fromDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'toDate', required: true, example: '2026-01-05' })
  @ApiQuery({ name: 'fromSession', required: true, enum: HolidaySession })
  @ApiQuery({ name: 'toSession', required: true, enum: HolidaySession })
  async calculateLeaveDays(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('fromSession') fromSession: HolidaySession,
    @Query('toSession') toSession: HolidaySession,
  ): Promise<{
    fromDate: string;
    toDate: string;
    totalCalendarDays: number;
    weekendDays: number;
    holidayDays: number;
    compensatoryDays: number;
    actualLeaveDays: number;
  }> {
    const start = new Date(fromDate);
    const end = new Date(toDate);

    const result = await this.holidayService.calculateLeaveDays(
      start,
      end,
      fromSession,
      toSession,
    );

    return {
      fromDate,
      toDate,
      ...result,
    };
  }

  @Get('check/:date')
  @ApiOperation({
    summary: 'Check if a date is a holiday',
    description: 'Returns holiday details if the date is a holiday',
  })
  async checkHoliday(@Param('date') dateStr: string): Promise<{
    date: string;
    isHoliday: boolean;
    holiday?: Holiday;
  }> {
    const date = new Date(dateStr);
    const isHoliday = await this.holidayService.isHoliday(date);

    if (isHoliday) {
      const holiday = await this.holidayService.getHolidayByDate(date);
      return {
        date: dateStr,
        isHoliday: true,
        holiday: holiday || undefined,
      };
    }

    return {
      date: dateStr,
      isHoliday: false,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get holiday by ID' })
  async findById(@Param('id') id: string): Promise<Holiday | null> {
    return await this.holidayService.findById(id);
  }

  @Get('compensatory/list')
  @ApiOperation({
    summary: 'Get all compensatory holidays',
    description:
      'Returns holidays that were created as compensation for holidays falling on weekends',
  })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getCompensatoryHolidays(
    @Query('year') year?: number,
  ): Promise<Holiday[]> {
    const holidays = year
      ? await this.holidayService.findByYear(year)
      : await this.holidayService.findAll();

    return holidays.filter((h) => h.isCompensatory);
  }

  @Get('compensatory/:originalId')
  @ApiOperation({
    summary: 'Get compensatory holiday by original holiday ID',
    description: 'Find the compensatory holiday linked to an original holiday',
  })
  async getCompensatoryByOriginal(
    @Param('originalId') originalId: string,
  ): Promise<Holiday | null> {
    const allHolidays = await this.holidayService.findAll();
    const compensatory = allHolidays.find(
      (h) => h.isCompensatory && h.originalHolidayId === originalId,
    );

    return compensatory || null;
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new holiday',
    description:
      'Allows multiple holidays on same date. ' +
      'If holiday is FIXED type and falls on weekend, automatically creates compensatory holiday on next Monday.',
  })
  async create(
    @Body() dto: CreateHolidayDto,
  ): Promise<CreateHolidayResponseDto> {
    const id = randomUUID();

    const holiday = new Holiday(
      id,
      dto.name,
      new Date(dto.date),
      dto.type,
      dto.session,
      dto.isRecurring ?? false,
      '80f02965-8aac-4521-848a-e8d6bf8f2e82',
    );

    await this.holidayService.create(holiday);

    const needsCompensation = holiday.needsCompensation();

    const response: CreateHolidayResponseDto = {
      message: 'Holiday created successfully',
      holiday: {
        id: holiday.id,
        name: holiday.name,
        date: dto.date,
        needsCompensation,
      },
    };

    if (needsCompensation) {
      const compensatoryDate = holiday.getCompensatoryDate();

      const compensatory =
        await this.holidayService.getHolidayByDate(compensatoryDate);

      if (compensatory) {
        response.compensatory = {
          id: compensatory.id,
          name: compensatory.name,
          date: compensatoryDate.toISOString().split('T')[0],
        };
      }
    }

    return response;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a holiday' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHolidayDto,
  ): Promise<{ message: string }> {
    const updateData: Partial<Holiday> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.type) updateData.type = dto.type;
    if (dto.session) updateData.session = dto.session;
    if (dto.isRecurring !== undefined) updateData.isRecurring = dto.isRecurring;

    await this.holidayService.update(id, updateData);
    return { message: 'Holiday updated successfully' };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a holiday',
    description:
      'Note: Deleting a holiday does NOT automatically delete its compensatory holiday',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.holidayService.delete(id);
    return { message: 'Holiday deleted successfully' };
  }

  @Post('generate-recurring/:year')
  @ApiOperation({
    summary: 'Generate recurring holidays for a year',
    description:
      'Creates all recurring holidays for the specified year. ' +
      'Automatically creates compensatory holidays if any fall on weekends.',
  })
  async generateRecurring(@Param('year', ParseIntPipe) year: number): Promise<{
    year: number;
    generated: number;
    compensated: number;
    message: string;
  }> {
    const result = await this.holidayService.generateRecurringHolidays(year);
    return {
      year,
      ...result,
      message: `Generated ${result.generated} holidays, ${result.compensated} compensatory holidays for ${year}`,
    };
  }
}
