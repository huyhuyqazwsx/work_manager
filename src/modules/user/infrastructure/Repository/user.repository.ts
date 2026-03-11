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
import { AccountIdsInfo, AccountStatusBuckets } from '@domain/type/user.types';
import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';
import { NotifyEmailResponse } from '@modules/leave/application/dto/notify_email_response.dto';

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

  async findAll(tx?: PrismaTransactionClient): Promise<UserAuth[]> {
    const raws = await this.getModel(tx).findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return raws.map((r) => UserMapper.toDomain(r));
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
    const result = await this.prisma.$queryRaw<{ code: string }[]>`
      SELECT code
      FROM "users"
      WHERE code LIKE 'SG%'
      ORDER BY CAST(SUBSTRING(code FROM 3) AS INTEGER) DESC
      LIMIT 1
    `;

    return result[0]?.code ?? null;
  }

  async classifyAccounts(mails: string[]): Promise<AccountStatusBuckets> {
    const users = await this.prisma.user.findMany({
      where: {
        email: { in: mails },
      },
      select: {
        email: true,
        status: true,
      },
    });

    // email → status
    const userMap = new Map(users.map((u) => [u.email, u.status]));

    const result: AccountStatusBuckets = {
      pendingInSystem: [],
      notFound: [],
      active: [],
      inactive: [],
    };

    for (const mail of mails) {
      const status = userMap.get(mail);

      if (!status) {
        result.notFound.push(mail);
        continue;
      }

      if (status === 'PENDING') {
        result.pendingInSystem.push(mail);
        continue;
      }

      if (status === 'ACTIVE') {
        result.active.push(mail);
        continue;
      }

      result.inactive.push(mail);
    }

    return result;
  }

  async getIdsByEmails(mails: string[]): Promise<AccountIdsInfo> {
    const result: AccountIdsInfo = {
      inSystem: [],
      notFound: [],
    };
    const users = await this.prisma.user.findMany({
      where: {
        email: { in: mails },
      },
      select: {
        email: true,
        id: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.email, u.id]));

    for (const mail of mails) {
      const id = userMap.get(mail);
      if (!id) result.notFound.push(mail);
      else result.inSystem.push(id);
    }

    return result;
  }

  async getInfoNotifyEmail(
    byRoles: UserRole[],
    includeManager: boolean,
    departmentId: string,
  ): Promise<NotifyEmailResponse> {
    const managerId = includeManager
      ? ((
          await this.prisma.department.findUnique({
            where: { id: departmentId },
            select: { managerId: true },
          })
        )?.managerId ?? null)
      : null;

    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          ...(byRoles.length > 0 ? [{ role: { in: byRoles } }] : []),
          ...(managerId ? [{ id: managerId }] : []),
        ],
      },
      select: { email: true, fullName: true, role: true },
    });

    return {
      info: users.map((u) => ({
        email: u.email,
        name: u.fullName,
        role: u.role,
      })),
    };
  }
}
