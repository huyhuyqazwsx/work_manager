import { HolidaySession } from '@domain/enum/enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum } from 'class-validator';

export class CalculateLeaveDaysDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ example: '2024-01-20' })
  @IsDateString()
  toDate: string;

  @ApiProperty({ enum: HolidaySession, example: HolidaySession.FULL })
  @IsEnum(HolidaySession)
  fromSession: HolidaySession;

  @ApiProperty({ enum: HolidaySession, example: HolidaySession.FULL })
  @IsEnum(HolidaySession)
  toSession: HolidaySession;
}
