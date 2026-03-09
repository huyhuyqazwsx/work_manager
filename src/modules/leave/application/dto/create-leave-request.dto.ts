import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { HolidaySession, LeaveTypeCode } from '@domain/enum/enum';

export class CreateLeaveRequestDto {
  @ApiProperty({ example: 'uuid-user-id' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: LeaveTypeCode })
  @IsEnum(LeaveTypeCode)
  leaveTypeCode: LeaveTypeCode;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ example: '2026-03-12' })
  @IsDateString()
  toDate: string;

  @ApiProperty({ enum: HolidaySession, example: HolidaySession.MORNING })
  @IsEnum(HolidaySession)
  fromSession: HolidaySession;

  @ApiProperty({ enum: HolidaySession, example: HolidaySession.AFTERNOON })
  @IsEnum(HolidaySession)
  toSession: HolidaySession;

  @ApiPropertyOptional({ example: 'Personal work' })
  @IsString()
  @IsOptional()
  reason?: string;
}
