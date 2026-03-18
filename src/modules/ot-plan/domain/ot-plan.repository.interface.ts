import { IBaseRepository } from '@domain/repositories/base.repository';
import { OTPlan } from '@domain/entities/ot-plan.entity';
import { OTPlanStatus } from '@domain/enum/enum';

export interface IOTPlanRepository extends IBaseRepository<OTPlan> {
  findByManagerId(
    managerId: string,
    page: number,
    limit: number,
    status?: string,
    fromDate?: string,
    toDate?: string,
    search?: string,
  ): Promise<{
    data: OTPlan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  findByStatus(status: OTPlanStatus): Promise<OTPlan[]>;
  findByDepartmentId(departmentId: string): Promise<OTPlan[]>;
}
