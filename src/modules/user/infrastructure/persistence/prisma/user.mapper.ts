import { UserAuth } from '../../../../../domain/entities/user/userAuth.entity';
import { UserStatus } from '../../../../../domain/enum/user-status.enum';
import { User as PrismaUser } from '@prisma/client';
import { UserRole } from '../../../../../domain/enum/user-role.enum';

export class UserMapper {
  static toDomain(raw: PrismaUser): UserAuth {
    return new UserAuth(
      raw.id,
      raw.email,
      raw.gender,
      raw.status as UserStatus,
      raw.role as UserRole,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(
    user: UserAuth | Partial<UserAuth>,
  ): Record<string, any> {
    return {
      ...(user.id && { id: user.id }),
      ...(user.email && { email: user.email }),
      ...(user.status && { status: user.status }),
      ...(user.gender && { gender: user.gender }),
      ...(user.role && { role: user.role }),
      ...(user.createdAt && { createdAt: user.createdAt }),
      ...(user.updatedAt && { updatedAt: user.updatedAt }),
    };
  }
}
