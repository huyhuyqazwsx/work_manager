import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ContractType } from '../../../../domain/enum/enum';

export class CreateOTConfigDto {
  @ApiProperty({ enum: ContractType, example: ContractType.OFFICIAL_EMPLOYEE })
  @IsEnum(ContractType)
  contractType: ContractType;

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

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(1)
  salaryMultiplier: number;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
