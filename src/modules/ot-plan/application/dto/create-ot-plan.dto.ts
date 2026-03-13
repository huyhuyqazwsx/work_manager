import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOTTicketItemDto } from './create-ot-ticket-item.dto';

export class CreateOTPlanDto {
  @ApiProperty()
  @IsUUID()
  departmentId: string;

  @ApiProperty()
  @IsUUID()
  managerId: string;

  @ApiProperty({ example: 'Deployment Server & Fix Critical Bug' })
  @IsString()
  reason: string;

  @ApiProperty({ type: [CreateOTTicketItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOTTicketItemDto)
  tickets: CreateOTTicketItemDto[];
}
