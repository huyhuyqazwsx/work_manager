import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, Min } from 'class-validator';
import { ContractType } from '@domain/enum/enum';

export class CreateLeaveConfigDto {
  @ApiProperty({ enum: ContractType, example: ContractType.OFFICIAL_EMPLOYEE })
  @IsEnum(ContractType)
  contractType: ContractType;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  baseDaysPerYear: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  bonusDaysPerCycle: number;

  @ApiProperty({ example: 5, description: '0 = not bonus' })
  @IsInt()
  @Min(0)
  bonusYearCycle: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  maxDaysPerRequest: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  minimumNoticeDays: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  prorateByMonth: boolean;

  @ApiProperty({ example: 15 })
  @IsInt()
  joinDateCutoffDay: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  allowNegativeBalance: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive?: boolean;
}
