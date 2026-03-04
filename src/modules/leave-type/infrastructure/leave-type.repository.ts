import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { LeaveType as PrismaLeaveType } from '@prisma/client';
import { LeaveType } from '@domain/entities/leave_type.entity';
import { ILeaveTypeRepository } from '../domain/repositories/leave-type.repository.interface';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { LeaveTypeMapper } from './leave-type.mapper';

@Injectable()
export class PrismaLeaveTypeRepository
  extends BasePrismaRepository<LeaveType, PrismaLeaveType>
  implements ILeaveTypeRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma.leaveType as unknown as PrismaDelegate<PrismaLeaveType>,
      LeaveTypeMapper,
    );
  }

  async findByCode(code: string): Promise<LeaveType | null> {
    const raw: PrismaLeaveType | null = await this.prismaModel.findFirst({
      where: { code },
    });
    return raw ? LeaveTypeMapper.toDomain(raw) : null;
  }

  async findAllActive(): Promise<LeaveType[]> {
    const records: PrismaLeaveType[] = await this.prismaModel.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => LeaveTypeMapper.toDomain(r));
  }
}
