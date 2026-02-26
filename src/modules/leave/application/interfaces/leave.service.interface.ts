import { IBaseCrudService } from '../../../../domain/crudservice/base-crud.service.interface';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';
import { LeaveEligibilityResponseDto } from '../dto/leave-eligibility-response.dto';

export interface ILeaveService extends IBaseCrudService<LeaveRequest> {
  findByUserId(userId: string): Promise<LeaveRequest[]>;
  createLeaveRequest(
    userId: string,
    leaveTypeId: string,
    fromDate: Date,
    toDate: Date,
    reason?: string,
  ): Promise<LeaveRequest>;
  handleLeaveRequest(leaveRequest: LeaveRequest): Promise<LeaveRequest>;
  getLeaveEligibility(
    userId: string,
    leaveTypeId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LeaveEligibilityResponseDto>;
}
