import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaveSession {
  FULL = 'FULL',
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
}

export class SendLeaveRequestMailDto {
  @ApiProperty({
    example: ['manager@company.com'],
    description: 'Recipient email(s)',
  })
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @ApiProperty({ example: 'NV001' })
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  departmentName: string;

  @ApiProperty({ example: 'ANNUAL_LEAVE', required: false })
  @IsOptional()
  @IsString()
  leaveTypeCode?: string;

  @ApiProperty({ example: '2026-03-05' })
  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @ApiProperty({ example: '2026-03-06' })
  @IsString()
  @IsNotEmpty()
  toDate: string;

  @ApiProperty({ example: 'MORNING', enum: LeaveSession })
  @IsEnum(LeaveSession)
  fromSession: LeaveSession;

  @ApiProperty({ example: 'AFTERNOON', enum: LeaveSession })
  @IsEnum(LeaveSession)
  toSession: LeaveSession;

  @ApiProperty({ example: 2 })
  @IsNumber()
  totalDays: number;

  @ApiProperty({ example: 'Việc gia đình', required: false })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiProperty({ example: 'Anh Minh' })
  @IsString()
  @IsNotEmpty()
  managerName: string;

  @ApiProperty({ example: 'https://hrm.skycorp.vn/leave-requests/123' })
  @IsString()
  @IsNotEmpty()
  actionLink: string;

  @ApiProperty({
    example: ['hr@company.com'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];
}
