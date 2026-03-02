import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseCrudService } from '../../../../infrastructure/crudservice/base-crud.service';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';
import { ILeaveService } from '../interfaces/leave.service.interface';
import * as leaveRepositoryInterface from '../../domain/repositories/leave.repository.interface';
import * as holidayServiceInterface from '../../../holiday/application/interfaces/holiday.service.interface';
import {
  LeaveRequestStatus,
  LeaveTypeCode,
  UserRole,
} from '../../../../domain/enum/enum';
import { randomUUID } from 'node:crypto';
import { LeaveEligibilityResponseDto } from '../dto/leave-eligibility-response.dto';
import * as leaveTypeServiceInterface from '../../../leave-type/application/interfaces/leave-type.service.interface';
import * as userServiceInterface from '../../../user/application/interfaces/user.service.interface';
import { UserAuth } from '../../../../domain/entities/userAuth.entity';
import { LeaveType } from '../../../../domain/entities/leave_type.entity';
import * as policyServiceInterface from '../../../policy/application/interfaces/policy.service.interface';
import * as departmentServiceInterface from '../../../department/application/interfaces/department.service.interface';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';

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

    this.logger.debug(leaveTypes);

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

  async findByUserId(userId: string): Promise<LeaveRequest[]> {
    return await this.leaveRepository.getByUserId(userId);
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
      dto,
      user,
      leaveType,
    );

    //Create leave request
    let leaveRequest = new LeaveRequest(
      randomUUID(),
      leaveType.id,
      dto.leaveStatus ?? LeaveRequestStatus.DRAFT,
      startDate,
      endDate,
      actualLeaveDays,
      dto.reason ?? null,
      dto.userId,
      null,
    );

    leaveRequest = await this.handleLeaveRequest(leaveRequest, user);

    return leaveRequest;
  }

  async updateLeaveRequest(
    leaveRequestId: string,
    dto: CreateLeaveRequestDto,
    submit: boolean = false,
  ): Promise<LeaveRequest> {
    let leaveRequest = await this.leaveRepository.findById(leaveRequestId);
    if (!leaveRequest) throw new NotFoundException('Leave request not found');

    if (leaveRequest.createdBy !== dto.userId) {
      throw new BadRequestException(
        'You are not allowed to update this leave request',
      );
    }

    if (leaveRequest.status !== LeaveRequestStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot update leave request with status "${leaveRequest.status}"`,
      );
    }

    const [user, leaveType] = await Promise.all([
      this.userService.findUserById(dto.userId),
      this.leaveTypeService.findByCode(dto.leaveTypeCode),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const { actualLeaveDays } = await this.validateLeaveRequest(
      dto,
      user,
      leaveType,
    );

    leaveRequest.fromDate = new Date(dto.fromDate);
    leaveRequest.toDate = new Date(dto.toDate);
    leaveRequest.totalDays = actualLeaveDays;
    leaveRequest.reason = dto.reason ?? null;
    leaveRequest.leaveTypeId = leaveType.id;
    leaveRequest.status = submit
      ? LeaveRequestStatus.PENDING
      : LeaveRequestStatus.DRAFT;

    leaveRequest = await this.handleLeaveRequest(leaveRequest, user);
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

    leaveRequest.status = LeaveRequestStatus.APPROVED;
    leaveRequest.approvedBy = approverId;

    await this.leaveRepository.save(leaveRequest);
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

    leaveRequest.status = LeaveRequestStatus.REJECTED;
    leaveRequest.approvedBy = approverId;

    if (reason) leaveRequest.reason = reason;

    await this.leaveRepository.save(leaveRequest);
    return leaveRequest;
  }
  //================ Private function =========================
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

    const yearsOfService = user.getYearsOfService();
    const totalAllowedDays = leaveConfig.calculateAllowedDays({
      joinDate: user.joinDate,
      targetYear,
      yearsOfService,
    });

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

  private async handleLeaveRequest(
    leaveRequest: LeaveRequest,
    user: UserAuth,
  ): Promise<LeaveRequest> {
    if (
      leaveRequest.status !== LeaveRequestStatus.DRAFT &&
      leaveRequest.status !== LeaveRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        `Leave request cannot be processed because it is currently in "${leaveRequest.status}" status.`,
      );
    }

    if (leaveRequest.status === LeaveRequestStatus.DRAFT) {
      await this.leaveRepository.save(leaveRequest);
      return leaveRequest;
    }

    const department = await this.departmentService.findById(user.departmentId);

    if (!department) {
      throw new NotFoundException('Not found department of user');
    }
    if (!department.managerId) {
      throw new NotFoundException(`Not found manager of ${department.name}`);
    }

    const manager = await this.userService.findUserById(department.managerId);

    const hr = await this.userService.findUsersByRole(UserRole.HR);

    this.logger.debug(manager);
    this.logger.debug(hr);
    return leaveRequest;
  }

  private async validateLeaveRequest(
    dto: CreateLeaveRequestDto,
    user: UserAuth,
    leaveType: LeaveType,
  ): Promise<{ actualLeaveDays: number }> {
    const startDate = new Date(dto.fromDate);
    const endDate = new Date(dto.toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException(
        `Leave start date "${dto.fromDate}" is in the past`,
      );
    }

    if (startDate > endDate) {
      throw new BadRequestException('Invalid date range');
    }

    const { actualLeaveDays } = await this.holidayService.calculateLeaveDays(
      startDate,
      endDate,
    );

    if (actualLeaveDays <= 0) {
      throw new BadRequestException('No valid leave days in selected range');
    }

    const targetYear = new Date().getFullYear();

    let response: LeaveEligibilityResponseDto;

    switch (dto.leaveTypeCode) {
      case LeaveTypeCode.ANNUAL: {
        response = await this.handleAnnualLeave(leaveType, user, targetYear);
        if (!response.isEligible)
          throw new BadRequestException(response.reason);
        if (actualLeaveDays > response.remainingDays) {
          throw new BadRequestException(
            `Insufficient annual leave balance. Remaining: ${response.remainingDays}, Requested: ${actualLeaveDays}`,
          );
        }
        break;
      }
      case LeaveTypeCode.COMPENSATORY: {
        response = await this.handleCompensatoryLeave(leaveType, user);
        if (!response.isEligible)
          throw new BadRequestException(response.reason);
        if (actualLeaveDays > response.remainingDays) {
          throw new BadRequestException(
            `Insufficient compensatory leave balance. Remaining: ${response.remainingDays}, Requested: ${actualLeaveDays}`,
          );
        }
        break;
      }
      case LeaveTypeCode.PAID_PERSONAL: {
        response = await this.handlePaidPersonalLeave(leaveType, user);
        if (!response.isEligible)
          throw new BadRequestException(response.reason);
        break;
      }
      case LeaveTypeCode.SOCIAL_INSURANCE: {
        response = await this.handleSocialInsuranceLeave(leaveType, user);
        if (!response.isEligible)
          throw new BadRequestException(response.reason);
        break;
      }
      default:
        throw new BadRequestException('Leave type is not supported');
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
