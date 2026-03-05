import { IBaseRepository } from '@domain/repositories/base.repository';
import { OTPlan } from '@domain/entities/ot-plan.entity';
import { OTPlanStatus } from '@domain/enum/enum';

export interface IOTPlanRepository extends IBaseRepository<OTPlan> {
  findByManagerId(managerId: string): Promise<OTPlan[]>;
  findByStatus(status: OTPlanStatus): Promise<OTPlan[]>;
  findByDepartmentId(departmentId: string): Promise<OTPlan[]>;
}
