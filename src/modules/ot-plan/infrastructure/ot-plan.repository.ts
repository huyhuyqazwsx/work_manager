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

  async findByManagerId(managerId: string): Promise<OTPlan[]> {
    const raws = await this.prismaModel.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
    });
    return raws.map((r) => OTPlanMapper.toDomain(r));
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
