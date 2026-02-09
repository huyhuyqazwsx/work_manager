import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendInviteDto {
  @ApiProperty({
    description: 'Email cần gửi lại thư mời',
    example: 'user1@skysolution.com',
  })
  @IsEmail()
  email: string;
}
