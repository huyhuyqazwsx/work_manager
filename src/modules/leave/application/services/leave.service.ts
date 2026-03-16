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
  EmailType,
  HolidaySession,
  LeaveRequestStatus,
  LeaveTypeCode,
  PaidPersonalEventCode,
  UserRole,
} from '@domain/enum/enum';
import { randomUUID } from 'node:crypto';
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
import { AnnualLeaveDashboardDto } from '@modules/leave/application/dto/leave-dashboard.dto';
import { RangeExistDto } from '@modules/leave/application/dto/range-exist.dto';
import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';
import * as mailServiceInterface from '@modules/mail/application/interfaces/mail.service.interface';
import { Prisma } from '@prisma/client';
import * as fileUploadQueueRepositoryInterface from '@modules/leave/domain/repositories/file-upload-queue.repository.interface';

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
    @Inject('IMailService')
    private readonly mailService: mailServiceInterface.IMailService,
    @Inject('IFileUploadQueueRepository')
    private readonly fileUploadQueueRepository: fileUploadQueueRepositoryInterface.IFileUploadQueueRepository,
  ) {
    super(leaveRepository);
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

  async getMyLeaveRequests(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedLeaveRequests> {
    return await this.leaveRepository.getMyLeaveRequests(userId, page, limit);
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

    const [user, leaveType, infoLeaveDays, overlapping] = await Promise.all([
      this.userService.findUserById(dto.userId),
      this.leaveTypeService.findByCode(dto.leaveTypeCode),
      this.validateLeaveRequest(
        startDate,
        endDate,
        dto.fromSession,
        dto.toSession,
      ),
      this.leaveRepository.findOverlapping(dto.userId, startDate, endDate),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const conflicts = overlapping.filter((existing) =>
      this.isOverlapping(
        existing,
        startDate,
        endDate,
        dto.fromSession,
        dto.toSession,
      ),
    );

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      throw new BadRequestException(
        `Leave request overlaps with an existing request from ` +
          `${conflict.fromDate.toDateString()} (${conflict.fromSession}) ` +
          `to ${conflict.toDate.toDateString()} (${conflict.toSession})`,
      );
    }

    const actualLeaveDays = infoLeaveDays.actualLeaveDays;

    const [currentBalance, result, leader] = await Promise.all([
      this.resolveBalance(leaveType, user, dto.paidPersonalEventCode),
      this.getNotifyInfo(user.id),
      dto.emailLeader
        ? this.userRepository.findByEmail(dto.emailLeader)
        : Promise.resolve(null),
    ]);

    const paidDays = Math.min(actualLeaveDays, currentBalance);

    const unpaidDays = Math.max(0, actualLeaveDays - paidDays);

    const leaveRequest = new LeaveRequest(
      randomUUID(),
      leaveType.code,
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
      null,
      [],
    );

    const { emailSend, emailCC, managerName } = this.buildNotifyInfo(
      result,
      leader,
    );

    leaveRequest.emailSend = emailSend;
    leaveRequest.emailCC = emailCC;

    await this.leaveRepository.runInTransaction(async (tx) => {
      await this.leaveRepository.save(leaveRequest, tx);
      await this.notifyApprover(
        leaveRequest,
        user,
        managerName,
        EmailType.CREATE_LEAVE_REQUEST,
        tx,
      );
    });

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
      this.userRepository.findByCode(dto.userCode),
      this.leaveTypeService.findByCode(dto.leaveTypeCode),
    ]);

    if (!leaveType) throw new NotFoundException('Leave type not found');
    if (!user) throw new NotFoundException('User not found');

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
      if (err instanceof BadRequestException) throw err;

      result = {
        actualLeaveDays: 0,
        totalCalendarDays: 0,
        weekendDays: 0,
        holidayDays: 0,
        compensatoryDays: 0,
      };
    }

    const { actualLeaveDays, weekendDays, holidayDays } = result;

    const currentBalance = await this.resolveBalance(
      leaveType,
      user,
      dto.paidPersonalEventCode,
    );

    // this.logger.debug(currentBalance);

    const paidDays = Math.min(actualLeaveDays, currentBalance);

    const unpaidDays =
      currentBalance === -1 ? 0 : Math.max(0, actualLeaveDays - paidDays);

    const warnings: string[] = [];

    if (actualLeaveDays === 0) {
      warnings.push(
        'No valid leave days in selected range (weekends/holidays excluded)',
      );
    }

    if (unpaidDays > 0) {
      warnings.push(
        `This request includes ${unpaidDays} unpaid leave day(s) due to insufficient balance.`,
      );
    }

    return {
      actualLeaveDays,
      paidDays,
      unpaidDays,
      weekendDays,
      holidayDays,
      warnings,
    };
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

  async getAnnualLeaveDashboard(
    userId: string,
  ): Promise<AnnualLeaveDashboardDto> {
    const targetYear = new Date().getFullYear();

    const [user, annualLeaveType] = await Promise.all([
      this.userService.findUserById(userId),
      this.leaveTypeService.findByCode(LeaveTypeCode.ANNUAL),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!annualLeaveType)
      throw new NotFoundException('Annual leave type not found');

    // ===== Total allowed =====
    const leaveConfig = await this.policyService
      .getLeaveConfig(user.contractType)
      .catch(() => null);

    if (!leaveConfig?.isActive) {
      return {
        totalAllowedDays: 0,
        usedPaidDays: 0,
        usedUnpaidDays: 0,
        remainingPaidDays: 0,
        totalDays: 0,
        compensationHours: 0,
      };
    }

    const totalBase = leaveConfig.getTotalBase(user.joinDate, targetYear);
    const compensation = await this.compensationService.getBalanceByUserId(
      user.code!,
      targetYear,
    );

    const compensationHours = compensation.hours;

    const totalAllowedDays = leaveConfig.calculateAllowedDays({
      signDate: user.joinDate,
      targetYear,
    });

    // ===== Aggregate used & pending =====
    const summary = await this.leaveRepository.getAnnualLeaveSummary(
      userId,
      targetYear,
    );

    const usedPaidDays = summary?.usedPaidDays ?? 0;
    const usedUnpaidDays = summary?.usedUnpaidDays ?? 0;
    const totalDays = summary?.totalDays ?? 0;

    const remainingPaidDays = Math.max(0, totalAllowedDays - usedPaidDays);

    return {
      totalAllowedDays: totalBase,
      usedPaidDays,
      usedUnpaidDays,
      remainingPaidDays,
      totalDays,
      compensationHours,
    };
  }

  async getRangeExistLeaveRequest(
    userId: string,
    targetYear: number,
  ): Promise<RangeExistDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) throw new NotFoundException('User does not exist');

    return this.leaveRepository.getRangeExistLeaveRequest(userId, targetYear);
  }

  async getLeaveRequestByBod(bodId: string): Promise<LeaveRequest[]> {
    const bod = await this.userRepository.findById(bodId);
    if (!bod?.isBOD()) throw new NotFoundException('Bod does not exist');

    return this.leaveRepository.getLeaveRequestByBod();
  }

  // ================ Private =========================
  private isOverlapping(
    existing: LeaveRequest,
    newFrom: Date,
    newTo: Date,
    newFromSession: HolidaySession,
    newToSession: HolidaySession,
  ): boolean {
    const existStart = new Date(existing.fromDate);
    const existEnd = new Date(existing.toDate);
    const newStart = new Date(newFrom);
    const newEnd = new Date(newTo);

    existStart.setHours(
      existing.fromSession === HolidaySession.MORNING ? 12 : 18,
      0,
      0,
      0,
    );
    existEnd.setHours(
      existing.toSession === HolidaySession.MORNING ? 12 : 18,
      0,
      0,
      0,
    );

    newStart.setHours(
      newFromSession === HolidaySession.MORNING ? 12 : 18,
      0,
      0,
      0,
    );
    newEnd.setHours(newToSession === HolidaySession.MORNING ? 12 : 18, 0, 0, 0);

    const existStartTime = existStart.getTime();
    const existEndTime = existEnd.getTime();
    const newStartTime = newStart.getTime();
    const newEndTime = newEnd.getTime();

    return !(newEndTime < existStartTime || newStartTime > existEndTime);
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
        user.id,
        targetYear,
        leaveType.code,
      );
      //
      // this.logger.debug(totalAllowedDays);
      // this.logger.debug(usedDays);

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
        targetYear,
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
      const cloudUrl = await this.storageService.uploadImage(userId, file);
      await this.leaveRepository.update(leaveRequestId, {
        attachmentUrl: cloudUrl,
      });
      this.logger.log(`Uploaded to cloud: ${cloudUrl}`);
    } catch (cloudErr) {
      this.logger.warn('Cloud upload failed, saving local...', cloudErr);
      try {
        const { url, absPath } = await this.storageService.saveLocal(
          userId,
          file,
        );

        await this.leaveRepository.update(leaveRequestId, {
          attachmentUrl: url,
        });
        await this.fileUploadQueueRepository.save({
          id: randomUUID(),
          leaveRequestId,
          localPath: absPath,
          retryCount: 0,
          createdAt: new Date(),
        });

        this.logger.log(`Saved local, queued for sync: ${absPath}`);
      } catch (localErr) {
        this.logger.error('Local save failed', localErr);
      }
    }
  }

  private async notifyApprover(
    leaveRequest: LeaveRequest,
    user: UserAuth,
    managerName: string | null,
    emailType?: EmailType,
    tx?: PrismaTransactionClient,
  ): Promise<void> {
    if (!emailType || !leaveRequest.emailSend) return;

    let payload: Prisma.JsonObject | null = null;

    switch (emailType) {
      case EmailType.CREATE_LEAVE_REQUEST:
        payload = {
          employeeName: user.fullName,
          employeeCode: user.code,
          departmentName: user.departmentName,
          leaveTypeCode: leaveRequest.leaveTypeCode,
          fromDate: leaveRequest.fromDate.toISOString(),
          toDate: leaveRequest.toDate.toISOString(),
          fromSession: leaveRequest.fromSession,
          toSession: leaveRequest.toSession,
          totalDays: leaveRequest.totalDays,
          reason: leaveRequest.reason,
          managerName: managerName ?? 'Không tên',
          actionLink: 'test',
        };
        break;

      case EmailType.CANCELLED_LEAVE_REQUEST:
        payload = {};
        break;

      case EmailType.APPROVED_LEAVE_REQUEST:
        payload = {};
        break;

      case EmailType.REJECTED_LEAVE_REQUEST:
        payload = {};
        break;

      default:
        return;
    }

    // this.logger.debug(payload);

    await this.mailService.create(
      {
        id: randomUUID(),
        type: emailType,
        emailSend: leaveRequest.emailSend,
        emailCC: leaveRequest.emailCC,
        payload,
        createdAt: new Date(),
      },
      tx,
    );
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

    if (approver.isBOD()) return;

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

  private buildNotifyInfo(
    notifyInfo: NotifyEmailResponse,
    leader: UserAuth | null,
  ): {
    emailSend: string | null;
    emailCC: string[];
    managerName: string | null;
  } {
    let emailSend: string | null = null;
    let managerName: string | null = null;
    const emailCC: string[] = [];

    for (const notifyUser of notifyInfo.info) {
      const role = notifyUser.role as UserRole;
      if (role === UserRole.BOD || role === UserRole.DEPARTMENT_HEAD) {
        if (!emailSend) {
          emailSend = notifyUser.email;
          managerName = notifyUser.name;
        } else {
          emailCC.push(notifyUser.email);
        }
      } else {
        emailCC.push(notifyUser.email);
      }
    }

    if (leader) emailCC.push(leader.email);

    return { emailSend, emailCC, managerName };
  }
}
