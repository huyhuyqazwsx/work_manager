import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OTType } from '@domain/enum/enum';

export class CheckInOtTicketDto {
  @IsString()
  @IsNotEmpty()
  workPlan: string;

  @IsEnum(OTType)
  otType: OTType;
}
