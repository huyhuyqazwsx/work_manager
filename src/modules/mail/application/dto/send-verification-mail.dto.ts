import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationMailDto {
  @ApiProperty({
    example: 'user@skysolution.com',
    description: 'Chỉ chấp nhận email @skysolution.com',
  })
  email: string;

  @ApiProperty({
    example: '123abc',
  })
  verificationToken: string;
}
