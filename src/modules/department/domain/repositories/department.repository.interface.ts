import { IBaseRepository } from '../../../../domain/repositories/base.repository';
import { Department } from '../../../../domain/entities/department.entity';

export interface IDepartmentRepository extends IBaseRepository<Department> {
  findByName(name: string): Promise<Department | null>;
}
