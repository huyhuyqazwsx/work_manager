import { IBaseCrudService } from '../../../../domain/crudservice/base-crud.service.interface';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';
import { LeaveEligibilityResponseDto } from '../dto/leave-eligibility-response.dto';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';

export interface ILeaveService extends IBaseCrudService<LeaveRequest> {
  findByUserId(userId: string): Promise<LeaveRequest[]>;

  createLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest>;

  getLeaveEligibility(userId: string): Promise<LeaveEligibilityResponseDto[]>;
}
