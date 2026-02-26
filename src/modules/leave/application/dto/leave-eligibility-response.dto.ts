import { ApiProperty } from '@nestjs/swagger';

export class LeaveEligibilityResponseDto {
  @ApiProperty()
  actualDays: number;

  @ApiProperty()
  remaining: number;

  @ApiProperty()
  isEligible: boolean;

  @ApiProperty({ required: false })
  reason?: string;
}
