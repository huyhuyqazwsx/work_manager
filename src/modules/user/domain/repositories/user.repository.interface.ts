import { IBaseRepository } from '../../../../domain/repositories/base.repository';
import { UserAuth } from '../../../../domain/entities/userAuth.entity';

export interface IUserRepository extends IBaseRepository<UserAuth> {
  findByEmail(email: string): Promise<UserAuth | null>;
}
