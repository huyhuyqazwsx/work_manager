import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCompensationDto {
  @ApiProperty({
    example: 12,
    required: false,
    description: 'Set new hours value',
  })
  @IsOptional()
  @IsNumber()
  hours?: number;
}
