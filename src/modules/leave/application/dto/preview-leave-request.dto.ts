import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsString, IsOptional } from 'class-validator';
import {
  HolidaySession,
  LeaveTypeCode,
  PaidPersonalEventCode,
} from '@domain/enum/enum';

export class PreviewLeaveRequestDto {
  @ApiProperty({
    description: 'User Code',
    example: 'SG*',
  })
  @IsString()
  userCode: string;

  @ApiProperty({
    description: 'Leave type Code',
    example: 'ANNUAL_LEAVE',
  })
  @IsEnum(LeaveTypeCode)
  leaveTypeCode: string;

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
