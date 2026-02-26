import { IBaseRepository } from '../../../../domain/repositories/base.repository';
import { LeaveType } from '../../../../domain/entities/leave_type.entity';

export interface ILeaveTypeRepository extends IBaseRepository<LeaveType> {}