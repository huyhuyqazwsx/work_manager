import { User } from '../../../../entities/user/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  update(id: string, user: Partial<User>): Promise<void>;
  delete(id: string): Promise<void>;
}
