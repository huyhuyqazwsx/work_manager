import { UserRole } from '@domain/enum/enum';

export interface RequestUser {
  userId: string;
  role: UserRole;
}
