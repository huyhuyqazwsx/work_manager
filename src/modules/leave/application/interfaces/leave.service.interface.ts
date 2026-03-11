import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { LeaveEligibilityResponseDto } from '../dto/leave-eligibility-response.dto';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';
import { PreviewLeaveRequestDto } from '@modules/leave/application/dto/preview-leave-request.dto';
import { PreviewLeaveResponseDto } from '@modules/leave/application/dto/preview-leave-response.dto';
import { NotifyEmailResponse } from '@modules/leave/application/dto/notify_email_response.dto';

export interface ILeaveService extends IBaseCrudService<LeaveRequest> {
  findByUserId(userId: string): Promise<LeaveRequest[]>;

  createLeaveRequest(
    dto: CreateLeaveRequestDto,
    file?: Express.Multer.File,
  ): Promise<LeaveRequest>;

  getLeaveEligibility(userId: string): Promise<LeaveEligibilityResponseDto[]>;

  rejectLeaveRequest(
    leaveRequestId: string,
    approverId: string,
    reason?: string | null,
  ): Promise<LeaveRequest>;

  approveLeaveRequest(
    leaveRequestId: string,
    approverId: string,
  ): Promise<LeaveRequest>;

  cancelLeaveRequest(
    leaveRequestId: string,
    userId: string,
  ): Promise<LeaveRequest>;

  getLeaveRequestByManagerId(
    managerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLeaveRequests>;

  //Dùng để hiện cảnh báo cho phía fe thấy
  previewLeaveRequest(
    dto: PreviewLeaveRequestDto,
  ): Promise<PreviewLeaveResponseDto>;

  //Lấy thông tin email hr + trưởng phòng khi tạo form
  getNotifyInfo(userId: string): Promise<NotifyEmailResponse>;
}
