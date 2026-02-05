import { User } from '../../../../../entities/user/user.entity';
import { UserStatus } from '../../../../auth/domain/enum/user-status.enum';
import { Prisma } from '@prisma/client';
import { User as PrismaUser } from '@prisma/client';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return new User(
      raw.id,
      raw.email,
      raw.gender,
      raw.status as UserStatus,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      gender: user.gender,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
