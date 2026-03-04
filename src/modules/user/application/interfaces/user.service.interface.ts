import { UserAuth } from '@domain/entities/userAuth.entity';
import { InviteUsersResult } from '../dto/invite-user-result.dto';
import { InviteForm } from '@domain/type/invite.types';
import { UserRole } from '@domain/enum/enum';

export interface IUserService {
  findUserById(id: string): Promise<UserAuth | null>;
  findUserByEmail(email: string): Promise<UserAuth | null>;
  findUsersByRole(role: UserRole): Promise<UserAuth[]>;
  findAllUsers(): Promise<UserAuth[]>;
  createUser(user: UserAuth): Promise<void>;
  createUserFromOAuth(user: UserAuth): Promise<void>;
  updateUser(id: string, user: Partial<UserAuth>): Promise<void>;
  deleteUser(id: string): Promise<void>;

  inviteUsersFromExcel(invites: InviteForm[]): Promise<InviteUsersResult>;
  createPendingUserAndSendInvite(form: InviteForm): Promise<void>;
  resendInvite(email: string): Promise<void>;
  verifyEmail(email: string, token: string): Promise<void>;
  getProfile(userId: string): Promise<UserAuth | null>;
  getCountCode(): Promise<string>;
}
