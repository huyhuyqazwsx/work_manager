import { Department } from '../../../../domain/entities/department.entity';
import { Department as PrismaDepartment } from '@prisma/client';

export class DepartmentMapper {
  static toDomain(raw: PrismaDepartment): Department {
    return new Department(
      raw.id,
      raw.name,
      raw.code,
      raw.managerId,
      raw.isActive,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(
    department: Department | Partial<Department>,
  ): Record<string, any> {
    return {
      ...department,
    };
  }
}
