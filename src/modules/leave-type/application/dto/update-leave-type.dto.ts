import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateLeaveTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsBoolean()
  @IsOptional()
  deductCompensation?: boolean;
}
