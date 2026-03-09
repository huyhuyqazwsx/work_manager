import { ApiProperty } from '@nestjs/swagger';

export class CalculateLeaveDaysResponseDto {
  @ApiProperty()
  totalCalendarDays: number;

  @ApiProperty()
  weekendDays: number;

  @ApiProperty()
  holidayDays: number;

  @ApiProperty()
  compensatoryDays: number;

  @ApiProperty()
  actualLeaveDays: number;
}
