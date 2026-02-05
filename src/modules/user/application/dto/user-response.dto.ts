import { UserStatus } from '../../../auth/domain/enum/user-status.enum';

export class UserResponseDto {
  id: string;
  email: string;
  gender: string;
  status: UserStatus;
}
