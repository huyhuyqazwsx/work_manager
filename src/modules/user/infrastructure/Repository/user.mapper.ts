import { UserAuth } from '../../../../domain/entities/userAuth.entity';
import { User as PrismaUser } from '@prisma/client';
import { UserRole, UserStatus } from '../../../../domain/enum/enum';

export class UserMapper {
  static toDomain(raw: PrismaUser): UserAuth {
    return new UserAuth(
      raw.id,
      raw.email,
      raw.fullName,
      raw.gender,
      raw.status as UserStatus,
      raw.role as UserRole,
      raw.hireDate,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(
    user: UserAuth | Partial<UserAuth>,
  ): Record<string, any> {
    return {
      ...user,
    };
  }
}
