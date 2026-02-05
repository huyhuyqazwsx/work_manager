import { ApiProperty } from '@nestjs/swagger';

export class SendMailDto {
  @ApiProperty({ example: 'user@skysolution.com' })
  to: string;

  @ApiProperty({ example: 'Test Subject' })
  subject: string;

  @ApiProperty({ example: '<h1>Hello</h1>' })
  html: string;
}
