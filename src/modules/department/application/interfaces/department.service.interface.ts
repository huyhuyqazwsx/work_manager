import { IBaseCrudService } from '../../../../domain/crudservice/base-crud.service.interface';
import { Department } from '../../../../domain/entities/department.entity';

export interface IDepartmentService extends IBaseCrudService<Department> {
  findByName(name: string): Promise<Department | null>;
}
