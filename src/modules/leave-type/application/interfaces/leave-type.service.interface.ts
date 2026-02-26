import { IBaseCrudService } from '../../../../domain/crudservice/base-crud.service.interface';
import { LeaveType } from '../../../../domain/entities/leave_type.entity';

export interface ILeaveTypeService extends IBaseCrudService<LeaveType>{

}
