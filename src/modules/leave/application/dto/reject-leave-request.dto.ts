import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class RejectLeaveRequestDto {
  @ApiProperty({
    example: 'uid',
  })
  @IsUUID()
  approverId: string;

  @ApiProperty({
    example: 'Insufficient leave balance',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  reason?: string | null;
}
