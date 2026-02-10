import { UserAuth } from '../../../../domain/entities/userAuth.entity';
import { InviteUsersResult } from '../dto/invite-user-result.dto';
import { UserRole } from '../../../../domain/enum/enum';

export interface IUserService {
  findUserById(id: string): Promise<UserAuth | null>;
  findUserByEmail(email: string): Promise<UserAuth | null>;
  findAllUsers(): Promise<UserAuth[]>;
  createUser(user: UserAuth): Promise<void>;
  createUserFromOAuth(user: UserAuth): Promise<void>;
  updateUser(id: string, user: Partial<UserAuth>): Promise<void>;
  deleteUser(id: string): Promise<void>;

  inviteUsers(emails: string[]): Promise<InviteUsersResult>;
  createPendingUserAndSendInvite(email: string, role: UserRole): Promise<void>;
  resendInvite(email: string): Promise<void>;
  verifyEmail(email: string, token: string): Promise<void>;
}
