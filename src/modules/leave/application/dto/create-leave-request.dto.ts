import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  LeaveTypeCode,
  LeaveRequestStatus,
} from '../../../../domain/enum/enum';

export class CreateLeaveRequestDto {
  @ApiProperty({ example: 'uuid-user-id' })
  @IsString()
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

  @ApiPropertyOptional({
    enum: LeaveRequestStatus,
    default: LeaveRequestStatus.DRAFT,
  })
  @IsEnum(LeaveRequestStatus)
  @IsOptional()
  leaveStatus?: LeaveRequestStatus;

  @ApiPropertyOptional({ example: 'Personal work' })
  @IsString()
  @IsOptional()
  reason?: string;
}
