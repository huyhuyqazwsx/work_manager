import { Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../../../infrastructure/crudservice/base-crud.service';
import { Department } from '../../../../domain/entities/department.entity';
import * as departmentRepositoryInterface from '../../domain/repositories/department.repository.interface';
import { IDepartmentService } from '../interfaces/department.service.interface';

@Injectable()
export class DepartmentService
  extends BaseCrudService<Department>
  implements IDepartmentService
{
  constructor(
    @Inject('IDepartmentRepository')
    private readonly departmentRepository: departmentRepositoryInterface.IDepartmentRepository,
  ) {
    super(departmentRepository);
  }
  async findByName(name: string): Promise<Department | null> {
    return await this.departmentRepository.findByName(name);
  }
}
