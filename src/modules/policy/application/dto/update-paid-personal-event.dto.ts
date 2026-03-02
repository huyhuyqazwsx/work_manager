import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePaidPersonalEventDto {
  @ApiPropertyOptional({ example: 'Bản thân kết hôn' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allowedDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  resetOnUse?: boolean;
}
