import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';
import { LeaveType } from '@domain/entities/leave_type.entity';

export interface ILeaveTypeService extends IBaseCrudService<LeaveType> {
  findByCode(code: string): Promise<LeaveType | null>;
  findAllActive(): Promise<LeaveType[]>;
  createLeaveType(dto: {
    code: string;
    name: string;
    isPaid?: boolean;
    deductCompensation?: boolean;
  }): Promise<LeaveType>;
  updateLeaveType(
    id: string,
    dto: {
      name?: string;
      isPaid?: boolean;
      deductCompensation?: boolean;
    },
  ): Promise<LeaveType>;
}
