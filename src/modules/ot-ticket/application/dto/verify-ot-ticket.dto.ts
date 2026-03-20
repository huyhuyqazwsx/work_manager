import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class VerifyOTTicketDto {
  @ApiPropertyOptional({
    description: 'Actual OT hours (override if needed)',
    example: 3.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;
}
