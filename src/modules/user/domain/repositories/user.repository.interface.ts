import { IBaseRepository } from '@domain/repositories/base.repository';
import { UserAuth } from '@domain/entities/userAuth.entity';
import { UserRole } from '@domain/enum/enum';
import { AccountIdsInfo, AccountStatusBuckets } from '@domain/type/user.types';
import { NotifyEmailResponse } from '@modules/leave/application/dto/notify_email_response.dto';
import { UserInDepartmentDto } from '@modules/user/application/dto/user-in-department.dto';

export interface IUserRepository extends IBaseRepository<UserAuth> {
  findByEmail(email: string): Promise<UserAuth | null>;
  findByRole(role: UserRole): Promise<UserAuth[]>;
  findByCode(code: string): Promise<UserAuth | null>;
  findMaxCode(): Promise<string | null>;
  classifyAccounts(mails: string[]): Promise<AccountStatusBuckets>;
  count(): Promise<number>;
  getIdsByEmails(mails: string[]): Promise<AccountIdsInfo>;
  getIdsByCodes(codes: string[]): Promise<AccountIdsInfo>;
  getInfoNotifyEmail(
    byRoles: UserRole[],
    includeManager: boolean,
    departmentId: string,
  ): Promise<NotifyEmailResponse>;
  getUsersByUserOfDepartment(managerId: string): Promise<UserInDepartmentDto[]>;
}
