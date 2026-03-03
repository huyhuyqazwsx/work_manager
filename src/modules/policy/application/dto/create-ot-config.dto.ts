import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateOTConfigDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(0)
  maxHoursPerDay: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0)
  maxHoursPerMonth: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  maxHoursPerYear: number;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
