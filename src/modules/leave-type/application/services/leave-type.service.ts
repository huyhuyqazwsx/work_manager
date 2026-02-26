import { Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../../../infrastructure/crudservice/base-crud.service';
import { LeaveType } from '../../../../domain/entities/leave_type.entity';
import * as leaveTypeServiceInterface from '../interfaces/leave-type.service.interface';
import * as leaveTypeRepositoryInterface from '../../domain/repositories/leave-type.repository.interface';

@Injectable()
export class LeaveTypeService
  extends BaseCrudService<LeaveType>
  implements leaveTypeServiceInterface.ILeaveTypeService
{
  constructor(
    @Inject('ILeaveTypeRepository')
    private readonly leaveTypeRepository: leaveTypeRepositoryInterface.ILeaveTypeRepository,
  ) {
    super(leaveTypeRepository);
  }
}
