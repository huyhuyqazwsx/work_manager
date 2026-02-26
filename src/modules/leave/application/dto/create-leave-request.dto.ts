import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({
    description: 'ID of leave type',
    example: 'b6c4e2d1-1234-4567-890a-abcdef123456',
  })
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({
    description: 'Start date of leave',
    example: '2026-06-10',
  })
  @IsDateString()
  fromDate: string;

  @ApiProperty({
    description: 'End date of leave',
    example: '2026-06-14',
  })
  @IsDateString()
  toDate: string;

  @ApiProperty({
    description: 'Reason for leave',
    example: 'Family trip',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
