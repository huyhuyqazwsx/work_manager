import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOTTicketItemDto } from './create-ot-ticket-item.dto';

export class PreviewOTPlanDto {
  @ApiProperty({ type: [CreateOTTicketItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOTTicketItemDto)
  tickets: CreateOTTicketItemDto[];
}

export class PreviewWarningItem {
  employeeCode: string;
  date: string;
  warnings: string[];
}

export class PreviewOTPlanResponseDto {
  warnings: PreviewWarningItem[];
  hasWarnings: boolean;
}
