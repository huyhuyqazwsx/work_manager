import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@skysolution.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'a3f9c1e2d4...',
  })
  @IsString()
  token: string;
}
