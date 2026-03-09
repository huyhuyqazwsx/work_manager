import { UserAuth } from '@domain/entities/userAuth.entity';
import { InviteUsersResult } from '../dto/invite-user-result.dto';
import { InviteForm } from '@domain/type/invite.types';
import { UserRole } from '@domain/enum/enum';
import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';
import { UserResponseDto } from '@modules/user/application/dto/user-response.dto';

export interface IUserService extends IBaseCrudService<UserAuth> {
  findUserById(id: string): Promise<UserAuth | null>;
  findUserByEmail(email: string): Promise<UserAuth | null>;
  findUsersByRole(role: UserRole): Promise<UserAuth[]>;
  findAllUsers(): Promise<UserResponseDto[]>;
  createUser(user: UserAuth): Promise<void>;
  createUserFromOAuth(user: UserAuth): Promise<void>;
  updateUser(id: string, user: Partial<UserAuth>): Promise<void>;
  deleteUser(id: string): Promise<void>;

  inviteUsersFromExcel(invites: InviteForm[]): Promise<InviteUsersResult>;
  createPendingUsersAndInvite(
    users: UserAuth[],
    emails: string[],
  ): Promise<void>;
  resendInvite(email: string): Promise<void>;
  verifyEmail(email: string, token: string): Promise<void>;
  getProfile(userId: string): Promise<UserAuth | null>;
  getCountCode(): Promise<string>;
}
