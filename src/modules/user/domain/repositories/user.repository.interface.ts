import { UserAuth } from '../../../../domain/entities/user/userAuth.entity';
import { IBaseRepository } from '../../../../domain/repositories/base.repository';

export interface IUserRepository extends IBaseRepository<UserAuth> {
  findByEmail(email: string): Promise<UserAuth | null>;
}
