import { IsDateString, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOTTicketItemDto {
  @ApiProperty({ example: 'SG001' })
  @IsString()
  employeeCode: string;

  @ApiProperty({ example: '2026-03-07' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-09' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @ApiProperty({ example: '21:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;
}
