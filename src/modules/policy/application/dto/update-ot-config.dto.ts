import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateOTConfigDto {
  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxHoursPerDay?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxHoursPerMonth?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxHoursPerYear?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
