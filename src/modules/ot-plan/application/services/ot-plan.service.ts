import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { IOTPlanService } from '../interfaces/ot-plan.service.interface';
import * as policyServiceInterface from '../../../policy/application/interfaces/policy.service.interface';
import * as userServiceInterface from '../../../user/application/interfaces/user.service.interface';
import * as otTicketServiceInterface from '@modules/ot-ticket/application/interfaces/ot-ticket.service.interface';
import { OTPlan } from '@domain/entities/ot-plan.entity';
import { OTTicket } from '@domain/entities/ot-ticket.entity';
import { CreateOTPlanDto } from '../dto/create-ot-plan.dto';
import { OTConfig } from '@domain/entities/ot-config.entity';
import { OTPlanStatus, OTTicketStatus } from '@domain/enum/enum';
import { randomUUID } from 'node:crypto';
import * as otPlanRepositoryInterface from '@modules/ot-plan/domain/ot-plan.repository.interface';
import { UpdateOTPlanDto } from '@modules/ot-plan/application/dto/update-ot-plan.dto';
import {
  PreviewOTPlanDto,
  PreviewOTPlanResponseDto,
  PreviewWarningItem,
} from '@modules/ot-plan/application/dto/preview-ot-plan.dto';
import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';
import * as userRepositoryInterface from '@modules/user/domain/repositories/user.repository.interface';
import { CreateOTTicketItemDto } from '../dto/create-ot-ticket-item.dto';
import { Prisma } from '@prisma/client';
import {
  TicketPayload,
  TicketPayloadItem,
} from '@domain/type/ticket-payload.type';
import { AppError, AppException } from '@domain/errors';

@Injectable()
export class OTPlanService
  extends BaseCrudService<OTPlan>
  implements IOTPlanService
{
  constructor(
    @Inject('IOTPlanRepository')
    private readonly otPlanRepository: otPlanRepositoryInterface.IOTPlanRepository,
    @Inject('IOTTicketService')
    private readonly otTicketService: otTicketServiceInterface.IOTTicketService,
    @Inject('IPolicyService')
    private readonly policyService: policyServiceInterface.IPolicyService,
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
    @Inject('IUserRepository')
    private readonly userRepository: userRepositoryInterface.IUserRepository,
  ) {
    super(otPlanRepository);
  }

  // ===== Public =====

  async getPlanById(planId: string): Promise<OTPlan> {
    const plan = await this.otPlanRepository.findById(planId);
    if (!plan)
      throw new AppException(
        AppError.OT_PLAN_NOT_FOUND,
        `OTPlan not found: "${planId}"`,
        HttpStatus.NOT_FOUND,
      );
    return plan;
  }

  async getMyPlans(
    managerId: string,
    page = 1,
    limit = 10,
    status?: string,
    fromDate?: string,
    toDate?: string,
    search?: string,
  ) {
    return this.otPlanRepository.findByManagerId(
      managerId,
      page,
      limit,
      status,
      fromDate,
      toDate,
      search,
    );
  }

  async getPendingPlans(): Promise<OTPlan[]> {
    return this.otPlanRepository.findByStatus(OTPlanStatus.PENDING);
  }

  async createPlan(dto: CreateOTPlanDto): Promise<OTPlan> {
    if (!dto.tickets || dto.tickets.length === 0) {
      throw new AppException(
        AppError.BAD_REQUEST,
        'Plan must have at least one ticket',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.validateEmployeeCodes(dto.tickets);

    const { planStartDate, planEndDate } = this.resolvePlanDateRange(
      dto.tickets,
    );

    const plan = new OTPlan(
      randomUUID(),
      dto.departmentId,
      dto.managerId,
      dto.reason,
      OTPlanStatus.DRAFT,
      planStartDate,
      planEndDate,
      this.buildPayload(dto.tickets),
      null,
      null,
      null,
    );

    await this.otPlanRepository.save(plan);
    return plan;
  }

  async updatePlan(planId: string, dto: UpdateOTPlanDto): Promise<OTPlan> {
    const plan = await this.getPlanById(planId);

    if (!plan.isDraft()) {
      throw new AppException(
        AppError.OT_PLAN_INVALID_STATUS,
        `Cannot update plan with status "${plan.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.reason !== undefined) plan.reason = dto.reason;

    if (dto.tickets !== undefined) {
      await this.validateEmployeeCodes(dto.tickets);

      const { planStartDate, planEndDate } = this.resolvePlanDateRange(
        dto.tickets,
      );

      plan.startDate = planStartDate;
      plan.endDate = planEndDate;
      plan.ticketPayload = this.buildPayload(dto.tickets);
    }

    await this.otPlanRepository.update(plan.id, plan);
    return plan;
  }

  async submitPlan(planId: string, managerId: string): Promise<OTPlan> {
    const plan = await this.getPlanById(planId);

    if (plan.managerId !== managerId) {
      throw new AppException(
        AppError.OT_PLAN_FORBIDDEN,
        'You are not allowed to submit this plan',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!plan.canSubmit()) {
      throw new AppException(
        AppError.OT_PLAN_INVALID_STATUS,
        `Cannot submit plan with status "${plan.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    plan.submit();
    await this.otPlanRepository.update(plan.id, plan);
    return plan;
  }

  async approvePlan(planId: string, approvedBy: string): Promise<OTPlan> {
    const plan = await this.getPlanById(planId);

    if (!plan.canApprove()) {
      throw new AppException(
        AppError.OT_PLAN_INVALID_STATUS,
        `Cannot approve plan with status "${plan.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const approver = await this.userService.findUserById(approvedBy);
    if (!approver)
      throw new AppException(
        AppError.USER_NOT_FOUND,
        'Approver not found',
        HttpStatus.NOT_FOUND,
      );
    if (!approver.isBOD()) {
      throw new AppException(
        AppError.AUTH_FORBIDDEN,
        'Only BOD can approve OT plans',
        HttpStatus.FORBIDDEN,
      );
    }

    plan.approve(approvedBy);

    const tickets = await this.buildTicketsFromPayload(plan);

    await this.otPlanRepository.runInTransaction(
      async (tx: PrismaTransactionClient) => {
        await this.otPlanRepository.update(plan.id, plan, tx);
        await this.otTicketService.createMany(tickets, tx);
      },
    );

    return plan;
  }

  async rejectPlan(
    planId: string,
    rejectedBy: string,
    note: string,
  ): Promise<OTPlan> {
    const plan = await this.getPlanById(planId);

    if (!plan.canReject()) {
      throw new AppException(
        AppError.OT_PLAN_INVALID_STATUS,
        `Cannot reject plan with status "${plan.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const rejecter = await this.userService.findUserById(rejectedBy);
    if (!rejecter)
      throw new AppException(
        AppError.USER_NOT_FOUND,
        'Rejecter not found',
        HttpStatus.NOT_FOUND,
      );
    if (!rejecter.isBOD()) {
      throw new AppException(
        AppError.AUTH_FORBIDDEN,
        'Only BOD can reject OT plans',
        HttpStatus.FORBIDDEN,
      );
    }

    plan.reject(rejectedBy, note);
    await this.otPlanRepository.update(plan.id, plan);
    return plan;
  }

  async revisePlan(planId: string, managerId: string): Promise<OTPlan> {
    const plan = await this.getPlanById(planId);

    if (plan.managerId !== managerId) {
      throw new AppException(
        AppError.OT_PLAN_FORBIDDEN,
        'You are not allowed to revise this plan',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!plan.isRejected()) {
      throw new AppException(
        AppError.OT_PLAN_INVALID_STATUS,
        `Cannot revise plan with status "${plan.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    plan.backToDraft();
    await this.otPlanRepository.update(plan.id, plan);
    return plan;
  }

  async cancelPlan(planId: string, managerId: string): Promise<void> {
    const plan = await this.getPlanById(planId);

    if (plan.managerId !== managerId) {
      throw new AppException(
        AppError.OT_PLAN_FORBIDDEN,
        'You are not allowed to cancel this plan',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!plan.isApproved()) {
      throw new AppException(
        AppError.OT_PLAN_INVALID_STATUS,
        `Cannot cancel plan with status "${plan.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.otPlanRepository.delete(planId);
  }

  async deletePlan(planId: string, managerId: string): Promise<void> {
    const plan = await this.getPlanById(planId);

    if (plan.managerId !== managerId) {
      throw new AppException(
        AppError.OT_PLAN_FORBIDDEN,
        'You are not allowed to delete this plan',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!plan.isDraft()) {
      throw new AppException(
        AppError.OT_PLAN_INVALID_STATUS,
        `Cannot delete plan with status "${plan.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.otPlanRepository.delete(planId);
  }

  async previewPlan(dto: PreviewOTPlanDto): Promise<PreviewOTPlanResponseDto> {
    await this.validateEmployeeCodes(dto.tickets);

    const codeToId = await this.resolveCodeToIdMap(dto.tickets);
    const otConfig = await this.policyService.getActiveOTConfig();

    const tickets = this.buildTicketsFromItems(
      randomUUID(),
      dto.tickets.map((t) => ({
        ...t,
        userId: codeToId.get(t.employeeCode)!,
      })),
    );

    const idToCode = new Map<string, string>(
      dto.tickets.map((t) => [codeToId.get(t.employeeCode)!, t.employeeCode]),
    );

    const warningResults = await Promise.all(
      tickets.map(async (ticket) => {
        const warnings = await this.validateTicketHours(ticket, otConfig);
        return { ticket, warnings };
      }),
    );

    const warningItems: PreviewWarningItem[] = warningResults
      .filter(({ warnings }) => warnings.length > 0)
      .map(({ ticket, warnings }) => ({
        employeeCode: idToCode.get(ticket.userId) ?? ticket.userId,
        date: ticket.workDate.toISOString().split('T')[0],
        warnings,
      }));

    return {
      warnings: warningItems,
      hasWarnings: warningItems.length > 0,
    };
  }

  // ===== Private =====

  private parseTicketPayload(raw: Prisma.JsonValue): TicketPayload | null {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return null;
    }

    const obj = raw as Record<string, Prisma.JsonValue>;
    const rawTickets = obj['tickets'];

    if (!Array.isArray(rawTickets)) return null;

    const tickets: TicketPayloadItem[] = [];

    for (const t of rawTickets) {
      if (typeof t !== 'object' || t === null || Array.isArray(t)) continue;

      const item = t as Record<string, Prisma.JsonValue>;

      if (
        typeof item['employeeCode'] !== 'string' ||
        typeof item['startDate'] !== 'string' ||
        typeof item['endDate'] !== 'string' ||
        typeof item['startTime'] !== 'string' ||
        typeof item['endTime'] !== 'string'
      )
        continue;

      tickets.push({
        employeeCode: item['employeeCode'],
        startDate: item['startDate'],
        endDate: item['endDate'],
        startTime: item['startTime'],
        endTime: item['endTime'],
      });
    }

    return { tickets };
  }

  private async validateEmployeeCodes(
    tickets: CreateOTTicketItemDto[],
  ): Promise<void> {
    const codes = tickets.map((t) => t.employeeCode);
    const { notFound } = await this.userRepository.getIdsByCodes(codes);

    if (notFound.length > 0) {
      throw new AppException(
        AppError.USER_NOT_FOUND,
        `Employee codes not found: ${notFound.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private async resolveCodeToIdMap(
    tickets: CreateOTTicketItemDto[],
  ): Promise<Map<string, string>> {
    const codes = tickets.map((t) => t.employeeCode);
    const { inSystem, notFound } =
      await this.userRepository.getIdsByCodes(codes);

    const foundCodes = codes.filter((c) => !notFound.includes(c));
    return new Map<string, string>(foundCodes.map((c, i) => [c, inSystem[i]]));
  }

  private buildPayload(tickets: CreateOTTicketItemDto[]): TicketPayload {
    return {
      tickets: tickets.map((t) => ({
        employeeCode: t.employeeCode,
        startDate: t.startDate,
        endDate: t.endDate,
        startTime: t.startTime,
        endTime: t.endTime,
      })),
    };
  }

  private resolvePlanDateRange(tickets: CreateOTTicketItemDto[]): {
    planStartDate: Date;
    planEndDate: Date;
  } {
    const allStartDates = tickets.map((t) => new Date(t.startDate).getTime());
    const allEndDates = tickets.map((t) => new Date(t.endDate).getTime());

    return {
      planStartDate: new Date(Math.min(...allStartDates)),
      planEndDate: new Date(Math.max(...allEndDates)),
    };
  }

  private async buildTicketsFromPayload(plan: OTPlan): Promise<OTTicket[]> {
    const payload = this.parseTicketPayload(plan.ticketPayload);
    if (!payload || payload.tickets.length === 0) return [];

    const dtoItems: CreateOTTicketItemDto[] = payload.tickets.map((t) => {
      const dto = new CreateOTTicketItemDto();
      dto.employeeCode = t.employeeCode;
      dto.startDate = t.startDate;
      dto.endDate = t.endDate;
      dto.startTime = t.startTime;
      dto.endTime = t.endTime;
      return dto;
    });

    const codeToId = await this.resolveCodeToIdMap(dtoItems);

    const items: (TicketPayloadItem & { userId: string })[] = payload.tickets
      .map((t) => {
        const userId = codeToId.get(t.employeeCode);
        if (!userId) return null;
        return { ...t, userId };
      })
      .filter((t): t is TicketPayloadItem & { userId: string } => t !== null);

    return this.buildTicketsFromItems(plan.id, items);
  }

  private buildTicketsFromItems(
    planId: string,
    items: (TicketPayloadItem & { userId: string })[],
  ): OTTicket[] {
    const tickets: OTTicket[] = [];

    for (const item of items) {
      const [startHour, startMin] = item.startTime.split(':').map(Number);
      const [endHour, endMin] = item.endTime.split(':').map(Number);

      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;
      const isOvernight = endTotalMin < startTotalMin;

      const totalHours = isOvernight
        ? (24 * 60 - startTotalMin + endTotalMin) / 60
        : (endTotalMin - startTotalMin) / 60;

      const current = new Date(item.startDate);
      const endDate = new Date(item.endDate);

      while (current <= endDate) {
        const workDate = new Date(current);

        const ticketStartTime = new Date(workDate);
        ticketStartTime.setHours(startHour, startMin, 0, 0);

        const ticketEndDate = isOvernight
          ? new Date(workDate.getTime() + 24 * 60 * 60 * 1000)
          : new Date(workDate);

        const ticketEndTime = new Date(ticketEndDate);
        ticketEndTime.setHours(endHour, endMin, 0, 0);

        tickets.push(
          new OTTicket(
            randomUUID(),
            planId,
            item.userId,
            null,
            workDate,
            ticketStartTime,
            ticketEndTime,
            Number(totalHours.toFixed(2)),
            OTTicketStatus.SCHEDULED,
            null,
            null,
            null,
            null,
            null,
          ),
        );

        current.setDate(current.getDate() + 1);
      }
    }

    return tickets;
  }

  private async validateTicketHours(
    ticket: OTTicket,
    otConfig: OTConfig,
  ): Promise<string[]> {
    const warnings: string[] = [];
    const totalHours = ticket.totalHours;

    if (ticket.isOvernight()) {
      const midnight = new Date(ticket.workDate);
      midnight.setHours(24, 0, 0, 0);

      const nextDay = new Date(ticket.endTime);
      nextDay.setHours(0, 0, 0, 0);

      const hoursDay1 =
        (midnight.getTime() - ticket.startTime.getTime()) / (1000 * 60 * 60);
      const hoursDay2 =
        (ticket.endTime.getTime() - nextDay.getTime()) / (1000 * 60 * 60);

      const [usedDay1, usedDay2, usedThisMonth, usedThisYear] =
        await Promise.all([
          this.otTicketService.sumHoursByUserAndDay(
            ticket.userId,
            ticket.workDate,
          ),
          this.otTicketService.sumHoursByUserAndDay(ticket.userId, nextDay),
          this.otTicketService.sumHoursByUserAndMonth(
            ticket.userId,
            ticket.workDate,
          ),
          this.otTicketService.sumHoursByUserAndYear(
            ticket.userId,
            ticket.workDate,
          ),
        ]);

      if (!otConfig.isOvernightValid(hoursDay1, hoursDay2)) {
        warnings.push(`Overnight OT vượt max ${otConfig.maxHoursPerDay}h/ngày`);
      }

      if (usedDay1 + hoursDay1 > otConfig.maxHoursPerDay) {
        warnings.push(
          `Vượt giới hạn ${otConfig.maxHoursPerDay}h/ngày (đã dùng ${usedDay1}h)`,
        );
      }

      if (usedDay2 + hoursDay2 > otConfig.maxHoursPerDay) {
        const nextDayStr = nextDay.toISOString().split('T')[0];
        warnings.push(
          `Ngày ${nextDayStr}: Vượt giới hạn ${otConfig.maxHoursPerDay}h/ngày (đã dùng ${usedDay2}h)`,
        );
      }

      const { valid, errors } = otConfig.validateHours({
        requestedHours: totalHours,
        usedHoursToday: 0,
        usedHoursThisMonth: usedThisMonth,
        usedHoursThisYear: usedThisYear,
      });

      if (!valid) warnings.push(...errors);
    } else {
      const [usedToday, usedThisMonth, usedThisYear] = await Promise.all([
        this.otTicketService.sumHoursByUserAndDay(
          ticket.userId,
          ticket.workDate,
        ),
        this.otTicketService.sumHoursByUserAndMonth(
          ticket.userId,
          ticket.workDate,
        ),
        this.otTicketService.sumHoursByUserAndYear(
          ticket.userId,
          ticket.workDate,
        ),
      ]);

      const { valid, errors } = otConfig.validateHours({
        requestedHours: totalHours,
        usedHoursToday: usedToday,
        usedHoursThisMonth: usedThisMonth,
        usedHoursThisYear: usedThisYear,
      });

      if (!valid) warnings.push(...errors);
    }

    return warnings;
  }
}
