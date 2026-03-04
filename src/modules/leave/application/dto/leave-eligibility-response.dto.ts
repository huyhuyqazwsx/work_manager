import { ApiProperty } from '@nestjs/swagger';
import { LeaveTypeCode } from '@domain/enum/enum';

export class LeaveEligibilityResponseDto {
  @ApiProperty({
    enum: LeaveTypeCode,
    example: LeaveTypeCode.ANNUAL,
    description: 'Code of the leave type',
  })
  leaveTypeCode: LeaveTypeCode;

  @ApiProperty({
    example: 'Annual Leave',
    description: 'Display name of the leave type',
  })
  leaveTypeName: string;

  @ApiProperty({
    example: 12,
    description: 'Total number of leave days allowed per year',
  })
  totalAllowedDays: number;

  @ApiProperty({
    example: 5,
    description: 'Number of leave days already used',
  })
  usedDays: number;

  @ApiProperty({
    example: 7,
    description: 'Number of leave days remaining',
  })
  remainingDays: number;

  @ApiProperty({
    example: true,
    description:
      'Indicates whether the employee is eligible to request this leave',
  })
  isEligible: boolean;

  @ApiProperty({
    example: null,
    description: 'Reason if the leave request is not eligible',
    nullable: true,
  })
  reason: string | null;
}
