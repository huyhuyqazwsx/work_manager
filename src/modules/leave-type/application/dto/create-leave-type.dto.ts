import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveTypeDto {
  @ApiProperty({
    example: 'ANNUAL_LEAVE',
    description: 'Unique code of the leave type',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Annual Leave',
    description: 'Display name of the leave type',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indicates whether this leave type is paid',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Indicates whether compensation will be deducted',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  deductCompensation?: boolean;
}
