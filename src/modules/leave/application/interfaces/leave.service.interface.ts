import { IBaseCrudService } from '../../../../domain/crudservice/base-crud.service.interface';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';

export interface ILeaveService extends IBaseCrudService<LeaveRequest> {
  findByUserId(userId: string): Promise<LeaveRequest[]>;
}
