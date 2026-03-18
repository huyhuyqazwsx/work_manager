import { Injectable } from '@nestjs/common';
import { OTPlan as PrismaOTPlan } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { OTPlan } from '@domain/entities/ot-plan.entity';
import { OTPlanMapper } from './ot-plan.mapper';
import { OTPlanStatus } from '@domain/enum/enum';
import { IOTPlanRepository } from '@modules/ot-plan/domain/ot-plan.repository.interface';
import { OTTicketMapper } from '@modules/ot-ticket/infrastructure/ot-ticket.mapper';

@Injectable()
export class PrismaOTPlanRepository
  extends BasePrismaRepository<OTPlan, PrismaOTPlan>
  implements IOTPlanRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.oTPlan as unknown as PrismaDelegate<PrismaOTPlan>,
      OTPlanMapper,
    );
  }

  async findById(id: string): Promise<OTPlan | null> {
    const raw = await this.prisma.oTPlan.findUnique({
      where: { id },
      include: { tickets: true },
    });

    if (!raw) return null;

    const plan = OTPlanMapper.toDomain(raw);
    plan.tickets = raw.tickets.map((r) => OTTicketMapper.toDomain(r));
    return plan;
  }

  async findByManagerId(
    managerId: string,
    page: number,
    limit: number,
    status?: string,
    fromDate?: string,
    toDate?: string,
    search?: string,
  ): Promise<{
    data: OTPlan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const currentPage = Math.max(page, 1);
    const pageSize = Math.min(limit, 50);
    const skip = (currentPage - 1) * pageSize;

    const andConditions: any[] = [{ managerId }];

    if (status) {
      andConditions.push({ status });
    }

    if (fromDate && toDate) {
      andConditions.push(
        { startDate: { lte: new Date(toDate) } },
        { endDate: { gte: new Date(fromDate) } },
      );
    }

    if (search) {
      andConditions.push({
        OR: [{ reason: { contains: search, mode: 'insensitive' } }],
      });
    }

    const where = { AND: andConditions };

    const [rows, total] = await Promise.all([
      this.prismaModel.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaModel.count({ where }),
    ]);

    return {
      data: rows.map((r) => OTPlanMapper.toDomain(r)),
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findByStatus(status: OTPlanStatus): Promise<OTPlan[]> {
    const raws = await this.prismaModel.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
    return raws.map((r) => OTPlanMapper.toDomain(r));
  }

  async findByDepartmentId(departmentId: string): Promise<OTPlan[]> {
    const raws = await this.prismaModel.findMany({
      where: { departmentId },
      orderBy: { createdAt: 'desc' },
    });
    return raws.map((r) => OTPlanMapper.toDomain(r));
  }
}
