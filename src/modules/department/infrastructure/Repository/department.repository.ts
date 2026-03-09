import { Injectable } from '@nestjs/common';
import { IDepartmentRepository } from '../../domain/repositories/department.repository.interface';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { Department } from '@domain/entities/department.entity';
import { Department as PrismaDepartment } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { DepartmentMapper } from './department.mapper';
import { DepartmentClassifyBuckets } from '@domain/type/department.type';

@Injectable()
export class PrismaDepartmentRepository
  extends BasePrismaRepository<Department, PrismaDepartment>
  implements IDepartmentRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.department as unknown as PrismaDelegate<PrismaDepartment>,
      DepartmentMapper,
    );
  }

  async findByName(name: string): Promise<Department | null> {
    const raw = await this.prismaModel.findFirst({
      where: { name },
    });

    return raw ? DepartmentMapper.toDomain(raw) : null;
  }

  async findByManagerId(managerId: string): Promise<Department | null> {
    const raw = await this.prismaModel.findFirst({
      where: { managerId: managerId },
    });
    return raw ? DepartmentMapper.toDomain(raw) : null;
  }

  async classifyDepartments(
    names: string[],
  ): Promise<DepartmentClassifyBuckets> {
    const departments = await this.prisma.department.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });

    const deptMap = new Map(departments.map((d) => [d.name, d.id]));

    const result: DepartmentClassifyBuckets = {
      found: {},
      notFound: [],
    };

    for (const name of names) {
      const id = deptMap.get(name);
      if (!id) {
        result.notFound.push(name);
      } else {
        result.found[name] = id; // name → id để service dùng
      }
    }

    return result;
  }
}
