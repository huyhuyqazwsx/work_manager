import { UserAuth } from '../../../../../domain/entities/userAuth.entity';
import { User as PrismaUser } from '@prisma/client';
import { UserRole, UserStatus } from '../../../../../domain/enum/enum';

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
      ...(user.id && { id: user.id }),
      ...(user.email && { email: user.email }),
      ...(user.fullName && { fullName: user.fullName }),
      ...(user.gender && { gender: user.gender }),
      ...(user.status && { status: user.status }),
      ...(user.role && { role: user.role }),
      ...(user.hireDate && { hireDate: user.hireDate }),
      ...(user.createdAt && { createdAt: user.createdAt }),
      ...(user.updatedAt && { updatedAt: user.updatedAt }),
    };
  }
}
