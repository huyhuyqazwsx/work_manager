import { User } from '../../../../entities/user/user.entity';

export interface IUserService {
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  createUserFromOAuth(user: User): Promise<void>;
  // getUserProfile(userId: string): Promise<UserResponseDto>;
}
