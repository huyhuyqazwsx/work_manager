import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional({
    example: 'Updated Annual Leave',
    description: 'Updated display name of the leave type',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indicates whether this leave type is paid',
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Indicates whether compensation will be deducted',
  })
  @IsBoolean()
  @IsOptional()
  deductCompensation?: boolean;
}
