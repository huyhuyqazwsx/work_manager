import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaidPersonalEventCode } from '../../../../domain/enum/enum';

export class CreatePaidPersonalEventDto {
  @ApiProperty({
    enum: PaidPersonalEventCode,
    example: PaidPersonalEventCode.FUNERAL,
  })
  @IsEnum(PaidPersonalEventCode)
  code: PaidPersonalEventCode;

  @ApiProperty({ example: 'Ma chay' })
  @IsString()
  name: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  allowedDays: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  resetOnUse?: boolean;
}
