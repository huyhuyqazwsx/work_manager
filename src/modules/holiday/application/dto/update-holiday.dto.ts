import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HolidaySession, HolidayType } from '../../../../domain/enum/enum';

export class UpdateHolidayDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ enum: HolidayType, required: false })
  @IsOptional()
  @IsEnum(HolidayType)
  type?: HolidayType;

  @ApiProperty({ enum: HolidaySession, required: false })
  @IsOptional()
  @IsEnum(HolidaySession)
  session?: HolidaySession;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
