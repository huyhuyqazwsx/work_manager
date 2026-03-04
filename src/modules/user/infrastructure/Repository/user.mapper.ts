import { UserAuth } from '@domain/entities/userAuth.entity';
import { User as PrismaUser } from '@prisma/client';
import { ContractType, UserRole, UserStatus } from '@domain/enum/enum';

export class UserMapper {
  static toDomain(raw: PrismaUser): UserAuth {
    return new UserAuth(
      raw.id,
      raw.code,
      raw.email,
      raw.fullName,
      raw.gender,
      raw.status as UserStatus,
      raw.role as UserRole,
      raw.departmentId,
      raw.position,
      raw.contractType as ContractType,
      raw.joinDate,
      raw.contractSignedDate,
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
