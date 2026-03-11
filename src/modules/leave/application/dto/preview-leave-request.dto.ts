import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';
import { HolidaySession, PaidPersonalEventCode } from '@domain/enum/enum';

export class PreviewLeaveRequestDto {
  @ApiProperty({
    description: 'User ID requesting leave',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Leave type ID',
    example: '8d7c0f8a-1b2c-4d5e-9f01-23456789abcd',
  })
  @IsUUID()
  leaveTypeId: string;

  @ApiPropertyOptional({ example: PaidPersonalEventCode.CHILD_MARRIAGE })
  @IsString()
  @IsOptional()
  @IsEnum(PaidPersonalEventCode)
  paidPersonalEventCode?: string;

  @ApiProperty({
    description: 'Start date of leave (ISO format)',
    example: '2026-03-10',
  })
  @IsDateString()
  fromDate: string;

  @ApiProperty({
    description: 'End date of leave (ISO format)',
    example: '2026-03-12',
  })
  @IsDateString()
  toDate: string;

  @ApiProperty({
    description: 'Start session of leave',
    enum: HolidaySession,
    example: HolidaySession.MORNING,
  })
  @IsEnum(HolidaySession)
  fromSession: HolidaySession;

  @ApiProperty({
    description: 'End session of leave',
    enum: HolidaySession,
    example: HolidaySession.AFTERNOON,
  })
  @IsEnum(HolidaySession)
  toSession: HolidaySession;
}
