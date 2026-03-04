import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { UserMapper } from './user.mapper';
import { UserAuth } from '@domain/entities/userAuth.entity';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { UserRole } from '@domain/enum/enum';

@Injectable()
export class PrismaUserRepository
  extends BasePrismaRepository<UserAuth, PrismaUser>
  implements IUserRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.user as unknown as PrismaDelegate<PrismaUser>,
      UserMapper,
    );
  }

  async findByEmail(email: string): Promise<UserAuth | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async findByRole(role: UserRole): Promise<UserAuth[]> {
    const raws = await this.prisma.user.findMany({
      where: { role },
    });

    return raws.map((r) => UserMapper.toDomain(r));
  }

  async findByCode(code: string): Promise<UserAuth | null> {
    const raw = await this.prisma.user.findUnique({
      where: { code },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findMaxCode(): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { code: { startsWith: 'SG' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    return user?.code ?? null;
  }
}
