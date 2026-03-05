import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OTType } from '@domain/enum/enum';

export class CreateOTTicketItemDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: OTType })
  @IsEnum(OTType)
  otType: OTType;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  workDate: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '2024-01-15T18:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-01-15T22:00:00Z' })
  @IsDateString()
  endTime: string;
}

export class CreateOTPlanDto {
  @ApiProperty()
  @IsUUID()
  managerId: string;

  @ApiProperty()
  @IsUUID()
  departmentId: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty({ type: [CreateOTTicketItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOTTicketItemDto)
  tickets: CreateOTTicketItemDto[];
}
