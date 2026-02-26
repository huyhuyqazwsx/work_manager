import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { HolidaySession, HolidayType } from '../../../../domain/enum/enum';

export class CreateHolidayDto {
  @ApiProperty({ example: 'Tết Nguyên Đán' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '2026-01-29', description: 'Format: YYYY-MM-DD' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ enum: HolidayType, example: HolidayType.FIXED })
  @IsNotEmpty()
  @IsEnum(HolidayType)
  type: HolidayType;

  @ApiProperty({ enum: HolidaySession, example: HolidaySession.FULL })
  @IsNotEmpty()
  @IsEnum(HolidaySession)
  session: HolidaySession;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
