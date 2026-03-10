import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
} from '@modules/ot-plan/application/dto/preview-ot-plan.dto';
import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';

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
  ) {
    super(otPlanRepository);
  }

  async getPlanById(planId: string): Promise<OTPlan> {
    const plan = await this.otPlanRepository.findById(planId);
    if (!plan) throw new NotFoundException(`OTPlan not found: "${planId}"`);
    return plan;
  }

  async getMyPlans(managerId: string): Promise<OTPlan[]> {
    return this.otPlanRepository.findByManagerId(managerId);
  }

  async getPendingPlans(): Promise<OTPlan[]> {
    return this.otPlanRepository.findByStatus(OTPlanStatus.PENDING);
  }

  async createPlan(dto: CreateOTPlanDto): Promise<OTPlan> {
    if (!dto.userIds || dto.userIds.length === 0) {
      throw new BadRequestException('Plan must have at least one user');
    }

    const plan = new OTPlan(
      randomUUID(),
      dto.departmentId,
      dto.managerId,
      dto.reason,
      OTPlanStatus.DRAFT,
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.startTime,
      dto.endTime,
      dto.userIds,
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
      throw new BadRequestException(
        `Cannot update plan with status "${plan.status}"`,
      );
    }

    if (dto.reason !== undefined) plan.reason = dto.reason;
    if (dto.startDate !== undefined) plan.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) plan.endDate = new Date(dto.endDate);
    if (dto.startTime !== undefined) plan.startTime = dto.startTime;
    if (dto.endTime !== undefined) plan.endTime = dto.endTime;
    if (dto.userIds !== undefined) plan.userIds = dto.userIds;

    await this.otPlanRepository.update(plan.id, plan);
    return plan;
  }

  async submitPlan(planId: string, managerId: string): Promise<OTPlan> {
    const plan = await this.getPlanById(planId);

    if (plan.managerId !== managerId) {
      throw new BadRequestException('You are not allowed to submit this plan');
    }

    if (!plan.canSubmit()) {
      throw new BadRequestException(
        `Cannot submit plan with status "${plan.status}"`,
      );
    }

    plan.submit();
    await this.otPlanRepository.update(plan.id, plan);
    return plan;
  }

  async approvePlan(planId: string, approvedBy: string): Promise<OTPlan> {
    const plan = await this.getPlanById(planId);

    if (!plan.canApprove()) {
      throw new BadRequestException(
        `Cannot approve plan with status "${plan.status}"`,
      );
    }

    const approver = await this.userService.findUserById(approvedBy);
    if (!approver) throw new NotFoundException('Approver not found');
    if (!approver.isBOD()) {
      throw new BadRequestException('Only BOD can approve OT plans');
    }

    plan.approve(approvedBy);

    const tickets = this.buildTickets(plan);

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
      throw new BadRequestException(
        `Cannot reject plan with status "${plan.status}"`,
      );
    }

    const rejecter = await this.userService.findUserById(rejectedBy);
    if (!rejecter) throw new NotFoundException('Rejecter not found');
    if (!rejecter.isBOD()) {
      throw new BadRequestException('Only BOD can reject OT plans');
    }

    plan.reject(rejectedBy, note);
    await this.otPlanRepository.update(plan.id, plan);
    return plan;
  }

  async revisePlan(planId: string, managerId: string): Promise<OTPlan> {
    const plan = await this.getPlanById(planId);

    if (plan.managerId !== managerId) {
      throw new BadRequestException('You are not allowed to revise this plan');
    }

    if (!plan.isRejected()) {
      throw new BadRequestException(
        `Cannot revise plan with status "${plan.status}"`,
      );
    }

    plan.backToDraft();
    await this.otPlanRepository.update(plan.id, plan);
    return plan;
  }

  async cancelPlan(planId: string, managerId: string): Promise<void> {
    const plan = await this.getPlanById(planId);

    if (plan.managerId !== managerId) {
      throw new BadRequestException('You are not allowed to cancel this plan');
    }

    if (!plan.isApproved()) {
      throw new BadRequestException(
        `Cannot cancel plan with status "${plan.status}"`,
      );
    }

    await this.otPlanRepository.delete(planId);
  }

  async deletePlan(planId: string, managerId: string): Promise<void> {
    const plan = await this.getPlanById(planId);

    if (plan.managerId !== managerId) {
      throw new BadRequestException('You are not allowed to delete this plan');
    }

    if (!plan.isDraft()) {
      throw new BadRequestException(
        `Cannot delete plan with status "${plan.status}"`,
      );
    }

    await this.otPlanRepository.delete(planId);
  }

  async previewPlan(dto: PreviewOTPlanDto): Promise<PreviewOTPlanResponseDto> {
    const otConfig = await this.policyService.getActiveOTConfig();
    const warnings: Record<string, string[]> = {};

    const tickets = this.buildTicketsFromDto(dto);

    await Promise.all(
      tickets.map(async (ticket) => {
        const ticketWarnings = await this.validateTicketHours(ticket, otConfig);
        if (ticketWarnings.length > 0) {
          const key = `${ticket.userId}_${ticket.workDate.toDateString()}`;
          warnings[key] = ticketWarnings;
        }
      }),
    );

    return {
      warnings,
      hasWarnings: Object.keys(warnings).length > 0,
    };
  }

  // ===== Private =====

  private async validateTicketHours(
    ticket: OTTicket,
    otConfig: OTConfig,
  ): Promise<string[]> {
    const warnings: string[] = [];
    const totalHours = ticket.totalHours;

    if (ticket.isOvernight()) {
      const midnight = new Date(ticket.workDate);
      midnight.setHours(24, 0, 0, 0);

      const endDate = new Date(ticket.endTime);
      endDate.setHours(0, 0, 0, 0);

      const hoursDay1 =
        (midnight.getTime() - ticket.startTime.getTime()) / (1000 * 60 * 60);
      const hoursDay2 =
        (ticket.endTime.getTime() - endDate.getTime()) / (1000 * 60 * 60);

      const [usedDay1, usedDay2, usedThisMonth, usedThisYear] =
        await Promise.all([
          this.otTicketService.sumHoursByUserAndDay(
            ticket.userId,
            ticket.workDate,
          ),
          this.otTicketService.sumHoursByUserAndDay(ticket.userId, endDate),
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
          `Ngày ${ticket.workDate.toDateString()}: Vượt giới hạn ${otConfig.maxHoursPerDay}h/ngày`,
        );
      }

      if (usedDay2 + hoursDay2 > otConfig.maxHoursPerDay) {
        warnings.push(
          `Ngày ${endDate.toDateString()}: Vượt giới hạn ${otConfig.maxHoursPerDay}h/ngày`,
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

  private buildTickets(plan: OTPlan): OTTicket[] {
    return this.buildTicketsFromParams(
      plan.id,
      plan.startDate,
      plan.endDate,
      plan.startTime,
      plan.endTime,
      plan.userIds,
    );
  }

  private buildTicketsFromDto(dto: PreviewOTPlanDto): OTTicket[] {
    return this.buildTicketsFromParams(
      randomUUID(),
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.startTime,
      dto.endTime,
      dto.userIds,
    );
  }

  private buildTicketsFromParams(
    planId: string,
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string,
    userIds: string[],
  ): OTTicket[] {
    const tickets: OTTicket[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    const isOvernight = endTotalMin < startTotalMin;

    const totalHours = isOvernight
      ? (24 * 60 - startTotalMin + endTotalMin) / 60
      : (endTotalMin - startTotalMin) / 60;

    const current = new Date(startDate);
    while (current <= endDate) {
      for (const userId of userIds) {
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
            userId,
            null,
            workDate,
            ticketStartTime,
            ticketEndTime,
            Number(totalHours.toFixed(2)),
            OTTicketStatus.SCHEDULED,
            null, // plan
            null, // result
            null, // actualHours
            null, // verifiedBy
            null, // rejectNote
          ),
        );
      }
      current.setDate(current.getDate() + 1);
    }

    return tickets;
  }
}
