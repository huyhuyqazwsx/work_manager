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
    @Inject('IPolicyService')
    private readonly policyService: policyServiceInterface.IPolicyService,
    @Inject('IDepartmentService')
    private readonly departmentService: departmentServiceInterface.IDepartmentService,
  ) {
    super(leaveRepository);
  }

  async getLeaveEligibility(
    userId: string,
  ): Promise<LeaveEligibilityResponseDto[]> {
    const targetYear = new Date().getFullYear();

    const [user, leaveTypes] = await Promise.all([
      this.userService.findUserById(userId),
      this.leaveTypeService.findAll(),
    ]);

    if (!user) throw new NotFoundException('User not found');

    return Promise.all(
      leaveTypes.map((leaveType) => {
        if (leaveType.isAnnualLeave()) {
          return this.handleAnnualLeave(leaveType, user, targetYear);
        }
        if (leaveType.isCompensatoryLeave()) {
          return this.handleCompensatoryLeave(leaveType, user);
        }
        if (leaveType.isPaidPersonalLeave()) {
          return this.handlePaidPersonalLeave(leaveType, user);
        }
        if (leaveType.isSocialInsuranceLeave()) {
          return this.handleSocialInsuranceLeave(leaveType, user);
        }

        return Promise.resolve({
          leaveTypeCode: leaveType.code,
          leaveTypeName: leaveType.name,
          totalAllowedDays: 0,
          usedDays: 0,
          remainingDays: 0,
          isEligible: false,
          reason: 'Not support',
        });
      }),
    );
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

  async createLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
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

    const leaveRequest = new LeaveRequest(
      randomUUID(),
      leaveType.id,
      LeaveRequestStatus.PENDING,
      startDate,
      endDate,
      dto.fromSession,
      dto.toSession,
      actualLeaveDays,
      dto.reason ?? null,
      dto.userId,
      null,
    );

    await this.leaveRepository.save(leaveRequest);
    await this.notifyApprover(leaveRequest, user);

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
      signDate: user.contractSignedDate,
      targetYear,
    });

    // TODO: handle used days
    const usedDays = 0;
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

  private handleCompensatoryLeave(
    leaveType: LeaveType,
    user: UserAuth,
  ): Promise<LeaveEligibilityResponseDto> {
    if (!user.isOfficialEmployee()) {
      return Promise.resolve({
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        totalAllowedDays: 0,
        usedDays: 0,
        remainingDays: 0,
        isEligible: false,
        reason: `Contract type "${user.contractType}" is not eligible for compensatory leave`,
      });
    }

    // TODO: implement later
    return Promise.resolve({
      leaveTypeCode: leaveType.code,
      leaveTypeName: leaveType.name,
      totalAllowedDays: 0,
      usedDays: 0,
      remainingDays: 0,
      isEligible: false,
      reason: 'Not implemented yet',
    });
  }

  private handlePaidPersonalLeave(
    leaveType: LeaveType,
    user: UserAuth,
  ): Promise<LeaveEligibilityResponseDto> {
    if (!user.isOfficialEmployee()) {
      return Promise.resolve({
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        totalAllowedDays: 0,
        usedDays: 0,
        remainingDays: 0,
        isEligible: false,
        reason: `Contract type "${user.contractType}" is not eligible for paid personal leave`,
      });
    }

    // TODO: implement later
    return Promise.resolve({
      leaveTypeCode: leaveType.code,
      leaveTypeName: leaveType.name,
      totalAllowedDays: 0,
      usedDays: 0,
      remainingDays: 0,
      isEligible: false,
      reason: 'Not implemented yet',
    });
  }

  private handleSocialInsuranceLeave(
    leaveType: LeaveType,
    user: UserAuth,
  ): Promise<LeaveEligibilityResponseDto> {
    if (!user.isOfficialEmployee()) {
      return Promise.resolve({
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        totalAllowedDays: 0,
        usedDays: 0,
        remainingDays: 0,
        isEligible: false,
        reason: `Contract type "${user.contractType}" is not eligible for social insurance leave`,
      });
    }

    return Promise.resolve({
      leaveTypeCode: leaveType.code,
      leaveTypeName: leaveType.name,
      totalAllowedDays: -1,
      usedDays: 0,
      remainingDays: -1,
      isEligible: true,
      reason: null,
    });
  }

  private async notifyApprover(
    leaveRequest: LeaveRequest,
    user: UserAuth,
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
  }

  private async validateLeaveRequest(
    startDate: Date,
    endDate: Date,
    fromSession: HolidaySession,
    toSession: HolidaySession,
  ): Promise<{ actualLeaveDays: number }> {
    if (startDate > endDate) {
      throw new BadRequestException('Invalid date range');
    }

    const { actualLeaveDays } = await this.holidayService.calculateLeaveDays(
      startDate,
      endDate,
      fromSession,
      toSession,
    );

    if (actualLeaveDays <= 0) {
      throw new BadRequestException('No valid leave days in selected range');
    }

    return { actualLeaveDays };
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
