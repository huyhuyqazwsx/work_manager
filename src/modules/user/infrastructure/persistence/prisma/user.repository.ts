import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { UserMapper } from './user.mapper';
import { UserAuth } from '../../../../../domain/entities/user/userAuth.entity';
import { BasePrismaRepository } from '../../../../../infrastructure/repository/base/base-prisma.repository';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PrismaService } from '../../../../../infrastructure/database/prisma/PrismaService';

@Injectable()
export class PrismaUserRepository
  extends BasePrismaRepository<UserAuth, PrismaUser>
  implements IUserRepository
{
  constructor(private readonly prisma: PrismaService) {
    super(prisma.user, UserMapper);
  }

  async findByEmail(email: string): Promise<UserAuth | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }
}
