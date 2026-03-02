import { IBaseRepository } from '../../../../domain/repositories/base.repository';
import { UserAuth } from '../../../../domain/entities/userAuth.entity';
import { UserRole } from '../../../../domain/enum/enum';

export interface IUserRepository extends IBaseRepository<UserAuth> {
  findByEmail(email: string): Promise<UserAuth | null>;
  findByRole(role: UserRole): Promise<UserAuth[]>;
  count(): Promise<number>;
}
