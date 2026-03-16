import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';
import { PreviewLeaveRequestDto } from '@modules/leave/application/dto/preview-leave-request.dto';
import { PreviewLeaveResponseDto } from '@modules/leave/application/dto/preview-leave-response.dto';
import { NotifyEmailResponse } from '@modules/leave/application/dto/notify_email_response.dto';
import { AnnualLeaveDashboardDto } from '@modules/leave/application/dto/leave-dashboard.dto';
import { RangeExistDto } from '@modules/leave/application/dto/range-exist.dto';

export interface ILeaveService extends IBaseCrudService<LeaveRequest> {
  findByUserId(userId: string): Promise<LeaveRequest[]>;

  createLeaveRequest(
    dto: CreateLeaveRequestDto,
    file?: Express.Multer.File,
  ): Promise<LeaveRequest>;

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

  getMyLeaveRequests(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLeaveRequests>;

  //Dùng để hiện cảnh báo cho phía fe thấy
  previewLeaveRequest(
    dto: PreviewLeaveRequestDto,
  ): Promise<PreviewLeaveResponseDto>;

  //Lấy thông tin email hr + trưởng phòng khi tạo form
  getNotifyInfo(userId: string): Promise<NotifyEmailResponse>;

  //Lấy thông tin hiện dasdboard
  getAnnualLeaveDashboard(userId: string): Promise<AnnualLeaveDashboardDto>;

  //Lấy các khoảng thời gian đã tồn tại (PENDING + APPROVED) để preview tránh gửi
  getRangeExistLeaveRequest(
    userId: string,
    targetYear: number,
  ): Promise<RangeExistDto>;

  //Lấy leave request cho BOD
  getLeaveRequestByBod(bodId: string): Promise<LeaveRequest[]>;
}
