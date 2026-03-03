import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber } from 'class-validator';

export class CreateCompensationDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: 10,
    description: 'Initial compensation hours',
  })
  @IsNumber()
  hours: number;
}
