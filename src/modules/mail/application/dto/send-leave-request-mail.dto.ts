import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendLeaveRequestMailDto {
  @ApiProperty({
    example: ['manager@company.com'],
    description: 'Recipient email(s)',
  })
  @IsNotEmpty()
  to: string | string[];

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @ApiProperty({ example: 'NV001' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: 'Nghỉ phép năm' })
  @IsString()
  @IsNotEmpty()
  leaveTypeName: string;

  @ApiProperty({ example: '05/03/2026' })
  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @ApiProperty({ example: '08:00', required: false })
  @IsOptional()
  @IsString()
  fromTime?: string;

  @ApiProperty({ example: '06/03/2026' })
  @IsString()
  @IsNotEmpty()
  toDate: string;

  @ApiProperty({ example: '17:00', required: false })
  @IsOptional()
  @IsString()
  toTime?: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  totalDays: number;

  @ApiProperty({ example: 'Việc gia đình', required: false })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiProperty({ example: 'Đã báo cáo trưởng nhóm', required: false })
  @IsOptional()
  @IsString()
  note?: string | null;

  @ApiProperty({ example: 'Anh Minh' })
  @IsString()
  @IsNotEmpty()
  managerName: string;

  @ApiProperty({ example: 'https://hrm.skycorp.vn/leave-requests/123' })
  @IsString()
  @IsNotEmpty()
  actionLink: string;

  @ApiProperty({ example: ['hr@company.com'], required: false })
  @IsOptional()
  cc?: string | string[];
}
