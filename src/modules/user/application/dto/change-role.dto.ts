import { IsEnum, IsString } from 'class-validator';
import { UserRole } from '@domain/enum/enum';

export class ChangeRoleDto {
  @IsString()
  userId: string;

  @IsEnum(UserRole)
  role: UserRole;
}
