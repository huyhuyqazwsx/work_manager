import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOTTicketItemDto } from './create-ot-ticket-item.dto';

export class UpdateOTPlanDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ type: [CreateOTTicketItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOTTicketItemDto)
  @IsOptional()
  tickets?: CreateOTTicketItemDto[];
}
