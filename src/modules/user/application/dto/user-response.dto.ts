import { UserStatus } from '../../../../domain/enum/enum';

export class UserResponseDto {
  id: string;
  email: string;
  gender: string;
  status: UserStatus;
}
