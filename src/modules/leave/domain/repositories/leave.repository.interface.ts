import { IBaseRepository } from '../../../../domain/repositories/base.repository';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';

export interface ILeaveRequestRepository extends IBaseRepository<LeaveRequest>{}