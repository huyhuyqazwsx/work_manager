import { IsArray, IsEmail, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUsersDto {
  @ApiProperty({
    description: 'Danh sách email cần mời',
    example: ['user1@skysolution.com', 'user2@skysolution.com'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  emails: string[];
}
