import { IBaseRepository } from '@domain/repositories/base.repository';
import { Department } from '@domain/entities/department.entity';
import { DepartmentClassifyBuckets } from '@domain/type/department.type';

export interface IDepartmentRepository extends IBaseRepository<Department> {
  findByName(name: string): Promise<Department | null>;
  findByManagerId(managerId: string): Promise<Department | null>;
  classifyDepartments(names: string[]): Promise<DepartmentClassifyBuckets>;
}
