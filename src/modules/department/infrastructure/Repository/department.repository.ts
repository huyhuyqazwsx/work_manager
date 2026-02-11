import { Injectable } from '@nestjs/common';
import { IDepartmentRepository } from '../../domain/repositories/department.repository.interface';
import { BasePrismaRepository } from '../../../../infrastructure/repository/base/base-prisma.repository';
import { Department } from '../../../../domain/entities/department.entity';
import { Department as PrismaDepartment } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/PrismaService';
import { DepartmentMapper } from './department.mapper';

@Injectable()
export class PrismaDepartmentRepository
  extends BasePrismaRepository<Department, PrismaDepartment>
  implements IDepartmentRepository
{
  constructor(prisma: PrismaService) {
    super(prisma.department, DepartmentMapper);
  }

  async findByName(name: string): Promise<Department | null> {
    const raw = await this.prismaModel.findFirst({
      where: { name },
    });

    return raw ? DepartmentMapper.toDomain(raw) : null;
  }
}
