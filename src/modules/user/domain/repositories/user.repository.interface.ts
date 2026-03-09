import { IBaseRepository } from '@domain/repositories/base.repository';
import { UserAuth } from '@domain/entities/userAuth.entity';
import { UserRole } from '@domain/enum/enum';
import { AccountStatusBuckets } from '@domain/type/user.types';

export interface IUserRepository extends IBaseRepository<UserAuth> {
  findByEmail(email: string): Promise<UserAuth | null>;
  findByRole(role: UserRole): Promise<UserAuth[]>;
  findByCode(code: string): Promise<UserAuth | null>;
  findMaxCode(): Promise<string | null>;
  classifyAccounts(mails: string[]): Promise<AccountStatusBuckets>;
  count(): Promise<number>;
}
