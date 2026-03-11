import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { ILeaveService } from '../interfaces/leave.service.interface';
import * as leaveRepositoryInterface from '../../domain/repositories/leave.repository.interface';
import * as holidayServiceInterface from '../../../holiday/application/interfaces/holiday.service.interface';
import {
  HolidaySession,
  LeaveRequestStatus,
  LeaveTypeCode,
  PaidPersonalEventCode,
  UserRole,
} from '@domain/enum/enum';
import { randomUUID } from 'node:crypto';
import { LeaveEligibilityResponseDto } from '../dto/leave-eligibility-response.dto';
import * as leaveTypeServiceInterface from '../../../leave-type/application/interfaces/leave-type.service.interface';
import * as userServiceInterface from '../../../user/application/interfaces/user.service.interface';
import { UserAuth } from '@domain/entities/userAuth.entity';
import { LeaveType } from '@domain/entities/leave_type.entity';
import * as policyServiceInterface from '../../../policy/application/interfaces/policy.service.interface';
import * as departmentServiceInterface from '../../../department/application/interfaces/department.service.interface';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';
import { PreviewLeaveResponseDto } from '@modules/leave/application/dto/preview-leave-response.dto';
import { PreviewLeaveRequestDto } from '@modules/leave/application/dto/preview-leave-request.dto';
import { StorageService } from '@infra/storage/storage.service';
import * as compensationServiceInterface from '@modules/compensation/application/interfaces/compensation.service.interface';
import { NotifyEmailResponse } from '@modules/leave/application/dto/notify_email_response.dto';
import * as userRepositoryInterface from '@modules/user/domain/repositories/user.repository.interface';

@Injectable()
export class LeaveService
  extends BaseCrudService<LeaveRequest>
  implements ILeaveService
{
  private logger = new Logger('LeaveService');

  constructor(
    @Inject('ILeaveRequestRepository')
    private readonly leaveRepository: leaveRepositoryInterface.ILeaveRequestRepository,
    @Inject('IHolidayService')
    private holidayService: holidayServiceInterface.IHolidayService,
    @Inject('ILeaveTypeService')
    private readonly leaveTypeService: leaveTypeServiceInterface.ILeaveTypeService,
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
    @Inject('IUserRepository')
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    @Inject('IPolicyService')
    private readonly policyService: policyServiceInterface.IPolicyService,
    @Inject('IDepartmentService')
    private readonly departmentService: departmentServiceInterface.IDepartmentService,
    private readonly storageService: StorageService,
    @Inject('ICompensationService')
    private readonly compensationService: compensationServiceInterface.ICompensationService,
  ) {
    super(leaveRepository);
  }

  async getLeaveEligibility(
    userId: string,
  ): Promise<LeaveEligibilityResponseDto[]> {
    const targetYear = new Date().getFullYear();

    const [user, annualLeaveType] = await Promise.all([
      this.userService.findUserById(userId),
      this.leaveTypeService.findByCode(LeaveTypeCode.ANNUAL),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!annualLeaveType) return [];

    return [await this.handleAnnualLeave(annualLeaveType, user, targetYear)];
  }

  async getLeaveRequestByManagerId(
    managerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedLeaveRequests> {
    const department = await this.departmentService.findByManagerId(managerId);
    if (!department) {
      throw new UnauthorizedException('Manager does not manage any department');
    }

    return await this.leaveRepository.getLeaveRequestByManagerId(
      managerId,
      department.id,
      page,
      limit,
    );
  }

  async findByUserId(userId: string): Promise<LeaveRequest[]> {
    return this.leaveRepository.getByUserId(userId);
  }

  async createLeaveRequest(
    dto: CreateLeaveRequestDto,
    file?: Express.Multer.File,
  ): Promise<LeaveRequest> {
    const startDate = new Date(dto.fromDate);
    const endDate = new Date(dto.toDate);

    const [user, leaveType] = await Promise.all([
      this.userService.findUserById(dto.userId),
      this.leaveTypeService.findByCode(dto.leaveTypeCode),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const { actualLeaveDays } = await this.validateLeaveRequest(
      startDate,
      endDate,
      dto.fromSession,
      dto.toSession,
    );

    const currentBalance = await this.resolveBalance(
      leaveType,
      user,
      dto.paidPersonalEventCode,
    );

    const paidDays = Math.min(actualLeaveDays, currentBalance);

    const unpaidDays = Math.max(0, actualLeaveDays - paidDays);

    const leaveRequest = new LeaveRequest(
      randomUUID(),
      leaveType.id,
      LeaveRequestStatus.PENDING,
      startDate,
      endDate,
      dto.fromSession,
      dto.toSession,
      actualLeaveDays,
      paidDays,
      unpaidDays,
      dto.reason ?? null,
      dto.userId,
      null,
      null,
      null,
    );

    await this.leaveRepository.save(leaveRequest);
    void this.notifyApprover(leaveRequest, user, dto.emailLeader);

    if (file) {
      void this.uploadAttachmentAsync(leaveRequest.id, dto.userId, file);
    }

    return leaveRequest;
  }

  async approveLeaveRequest(
    leaveRequestId: string,
    approverId: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRepository.findById(leaveRequestId);
    if (!leaveRequest) throw new NotFoundException('Leave request not found');

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve leave request with status "${leaveRequest.status}"`,
      );
    }

    await this.validateApprover(approverId, leaveRequest);

    leaveRequest.approve(approverId);

    await this.leaveRepository.update(leaveRequestId, leaveRequest);
    return leaveRequest;
  }

  async rejectLeaveRequest(
    leaveRequestId: string,
    approverId: string,
    reason?: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRepository.findById(leaveRequestId);
    if (!leaveRequest) throw new NotFoundException('Leave request not found');

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject leave request with status "${leaveRequest.status}"`,
      );
    }

    await this.validateApprover(approverId, leaveRequest);

    leaveRequest.reject(approverId);
    if (reason) leaveRequest.updateReason(reason);

    await this.leaveRepository.update(leaveRequestId, leaveRequest);
    return leaveRequest;
  }

  async cancelLeaveRequest(
    leaveRequestId: string,
    userId: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRepository.findById(leaveRequestId);
    if (!leaveRequest) throw new NotFoundException('Leave request not found');

    if (leaveRequest.createdBy !== userId) {
      throw new BadRequestException(
        'You are not allowed to cancel this leave request',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (leaveRequest.fromDate <= today) {
      throw new BadRequestException(
        'Cannot cancel leave request after start date',
      );
    }

    leaveRequest.cancel();

    await this.leaveRepository.update(leaveRequestId, leaveRequest);
    return leaveRequest;
  }

  async previewLeaveRequest(
    dto: PreviewLeaveRequestDto,
  ): Promise<PreviewLeaveResponseDto> {
    const startDate = new Date(dto.fromDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dto.toDate);
    endDate.setHours(23, 59, 59, 999);

    const [user, leaveType] = await Promise.all([
      this.userService.findUserById(dto.userId),
      this.leaveTypeService.findById(dto.leaveTypeId),
    ]);

    if (!leaveType) throw new NotFoundException('Leave type not found');
    if (!user) throw new NotFoundException('User not found');

    // Tính số ngày thực tế, nếu range không hợp lệ thì actualLeaveDays = 0
    type LeaveCalculationResult = {
      totalCalendarDays: number;
      weekendDays: number;
      holidayDays: number;
      compensatoryDays: number;
      actualLeaveDays: number;
    };

    let result: LeaveCalculationResult;

    try {
      result = await this.validateLeaveRequest(
        startDate,
        endDate,
        dto.fromSession,
        dto.toSession,
      );
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      result = {
        actualLeaveDays: 0,
        totalCalendarDays: 0,
        weekendDays: 0,
        holidayDays: 0,
        compensatoryDays: 0,
      };
    }

    const { actualLeaveDays } = result;

    // Lấy balance hiện tại theo leaveType
    const currentBalance = await this.resolveBalance(
      leaveType,
      user,
      dto.paidPersonalEventCode,
    );

    const remainingAfterRequest =
      currentBalance === -1 ? -1 : currentBalance - actualLeaveDays;

    const warnings: string[] = [];

    if (actualLeaveDays === 0) {
      warnings.push(
        'No valid leave days in selected range (weekends/holidays excluded)',
      );
    }

    if (remainingAfterRequest < 0) {
      warnings.push(
        `Insufficient balance: need ${actualLeaveDays} days but only ${currentBalance} remaining`,
      );
    } else if (remainingAfterRequest <= 2 && currentBalance !== -1) {
      warnings.push(
        `Low balance: only ${remainingAfterRequest} days remaining after this request`,
      );
    }

    return { actualLeaveDays, remainingAfterRequest, warnings };
  }

  async getNotifyInfo(userId: string): Promise<NotifyEmailResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User does not exist');

    switch (user.role) {
      case UserRole.EMPLOYEE:
        return this.userRepository.getInfoNotifyEmail(
          [UserRole.HR],
          true,
          user.departmentId,
        );

      case UserRole.DEPARTMENT_HEAD:
        return this.userRepository.getInfoNotifyEmail(
          [UserRole.BOD, UserRole.HR],
          false,
          user.departmentId,
        );

      case UserRole.HR:
        return this.userRepository.getInfoNotifyEmail(
          [UserRole.BOD],
          false,
          user.departmentId,
        );

      default:
        return { info: [] };
    }
  }
  // ================ Private =========================

  private async handleAnnualLeave(
    leaveType: LeaveType,
    user: UserAuth,
    targetYear: number,
  ): Promise<LeaveEligibilityResponseDto> {
    if (!user.isOfficialEmployee()) {
      return {
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        totalAllowedDays: 0,
        usedDays: 0,
        remainingDays: 0,
        isEligible: false,
        reason: `Contract type "${user.contractType}" is not eligible for annual leave`,
      };
    }

    const leaveConfig = await this.policyService
      .getLeaveConfig(user.contractType)
      .catch(() => null);

    if (!leaveConfig || !leaveConfig.isActive) {
      return {
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        totalAllowedDays: 0,
        usedDays: 0,
        remainingDays: 0,
        isEligible: false,
        reason: 'Annual leave configuration not found',
      };
    }

    const totalAllowedDays = leaveConfig.calculateAllowedDays({
      signDate: user.joinDate,
      targetYear,
    });

    const usedDays = await this.leaveRepository.calculatorUsedDay(
      targetYear,
      leaveType.id,
    );
    const remainingDays = Math.max(0, totalAllowedDays - usedDays);

    return {
      leaveTypeCode: leaveType.code,
      leaveTypeName: leaveType.name,
      totalAllowedDays,
      usedDays,
      remainingDays,
      isEligible: remainingDays > 0,
      reason:
        remainingDays <= 0
          ? 'Annual leave balance exhausted for this year'
          : null,
    };
  }

  private async resolveBalance(
    leaveType: LeaveType,
    user: UserAuth,
    paidPersonalEventCode?: string,
  ): Promise<number> {
    const targetYear = new Date().getFullYear();

    if (leaveType.isAnnualLeave()) {
      const leaveConfig = await this.policyService
        .getLeaveConfig(user.contractType)
        .catch(() => null);

      if (!leaveConfig?.isActive) return 0;

      const totalAllowedDays = leaveConfig.calculateAllowedDays({
        signDate: user.joinDate,
        targetYear,
      });

      const usedDays = await this.leaveRepository.calculatorUsedDay(
        targetYear,
        leaveType.id,
      );

      return Math.max(0, totalAllowedDays - usedDays);
    }

    if (leaveType.isPaidPersonalLeave()) {
      if (!paidPersonalEventCode) {
        throw new BadRequestException(
          'paidPersonalEventCode is required for paid personal leave',
        );
      }

      const event = await this.policyService
        .getPaidPersonalEvent(paidPersonalEventCode as PaidPersonalEventCode)
        .catch(() => null);

      return event?.allowedDays ?? 0;
    }

    if (leaveType.isSocialInsuranceLeave()) {
      // TODO: implement later (Social fund)
    }

    if (leaveType.isCompensatoryLeave()) {
      const balance = await this.compensationService.getBalanceByUserId(
        user.id,
      );

      return balance.getBalanceInDays();
    }

    return 0;
  }

  private async uploadAttachmentAsync(
    leaveRequestId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    try {
      const attachmentUrl = await this.storageService.uploadImage(userId, file);
      await this.leaveRepository.update(leaveRequestId, { attachmentUrl });
      this.logger.log('update attachment', attachmentUrl);
    } catch (err) {
      this.logger.error(
        `Failed to upload attachment for leave request ${leaveRequestId}`,
        err as Error,
      );
    }
  }

  private async notifyApprover(
    leaveRequest: LeaveRequest,
    user: UserAuth,
    emailLeader?: string,
  ): Promise<void> {
    const department = await this.departmentService.findById(user.departmentId);

    if (!department) throw new NotFoundException('Department not found');
    if (!department.managerId) {
      throw new NotFoundException(`Manager not found for ${department.name}`);
    }

    const [manager, hr] = await Promise.all([
      this.userService.findUserById(department.managerId),
      this.userService.findUsersByRole(UserRole.HR),
    ]);

    // TODO: send notification to manager and HR
    this.logger.debug(manager);
    this.logger.debug(hr);
    this.logger.debug(leaveRequest);
    this.logger.debug(emailLeader);
  }

  private async validateLeaveRequest(
    startDate: Date,
    endDate: Date,
    fromSession: HolidaySession,
    toSession: HolidaySession,
  ): Promise<{
    totalCalendarDays: number;
    weekendDays: number;
    holidayDays: number;
    compensatoryDays: number;
    actualLeaveDays: number;
  }> {
    if (startDate > endDate) {
      throw new BadRequestException('Invalid date range');
    }

    return await this.holidayService.calculateLeaveDays(
      startDate,
      endDate,
      fromSession,
      toSession,
    );
  }

  private async validateApprover(
    approverId: string,
    leaveRequest: LeaveRequest,
  ): Promise<void> {
    const [approver, requestOwner] = await Promise.all([
      this.userService.findUserById(approverId),
      this.userService.findUserById(leaveRequest.createdBy),
    ]);

    if (!approver) throw new NotFoundException('Approver not found');
    if (!requestOwner) throw new NotFoundException('Request owner not found');

    const department = await this.departmentService.findById(
      requestOwner.departmentId,
    );
    if (!department) throw new NotFoundException('Department not found');

    const isManager = department.managerId === approverId;

    if (!isManager) {
      throw new BadRequestException(
        'You are not allowed to perform this action',
      );
    }
  }
}
