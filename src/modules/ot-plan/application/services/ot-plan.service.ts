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
    if (!dto.tickets || dto.tickets.length === 0) {
      throw new BadRequestException('Plan must have at least one ticket');
    }

    const otConfig = await this.policyService.getActiveOTConfig();
    const planId = randomUUID();

    const tickets = dto.tickets.map((t) => {
      const startTime = new Date(t.startTime);
      const endTime = new Date(t.endTime);
      const workDate = new Date(t.workDate);

      const isOvernight = endTime < startTime;
      const endDate = isOvernight
        ? new Date(workDate.getTime() + 24 * 60 * 60 * 1000)
        : workDate;

      const totalHours = isOvernight
        ? (endTime.getTime() + 24 * 60 * 60 * 1000 - startTime.getTime()) /
          (1000 * 60 * 60)
        : (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      return new OTTicket(
        randomUUID(),
        planId,
        t.userId,
        t.otType,
        workDate,
        endDate,
        startTime,
        endTime,
        Number(totalHours.toFixed(2)),
        OTTicketStatus.SCHEDULED,
        null,
        null,
        null,
        null,
        null,
      );
    });

    for (const ticket of tickets) {
      await this.validateTicketHours(ticket, otConfig);
    }

    const plan = new OTPlan(
      planId,
      dto.departmentId,
      dto.managerId,
      dto.reason,
      OTPlanStatus.DRAFT,
      null,
      null,
      null,
      tickets,
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

    if (dto.reason !== undefined) {
      plan.reason = dto.reason;
    }

    if (dto.tickets !== undefined && dto.tickets.length > 0) {
      const otConfig = await this.policyService.getActiveOTConfig();

      plan.tickets = dto.tickets.map((t) => {
        const existing = t.id
          ? plan.tickets.find((ticket) => ticket.id === t.id)
          : undefined;

        const startTime = new Date(t.startTime ?? existing?.startTime ?? '');
        const endTime = new Date(t.endTime ?? existing?.endTime ?? '');
        const totalHours = Number(
          (
            (endTime.getTime() - startTime.getTime()) /
            (1000 * 60 * 60)
          ).toFixed(2),
        );

        const otType = t.otType ?? existing?.otType;
        if (!otType) throw new BadRequestException('OT type is required');

        return new OTTicket(
          existing?.id ?? randomUUID(),
          planId,
          t.userId ?? existing?.userId ?? '',
          otType,
          new Date(t.workDate ?? existing?.workDate ?? ''),
          new Date(t.endDate ?? existing?.endDate ?? ''),
          startTime,
          endTime,
          totalHours,
          OTTicketStatus.SCHEDULED,
          null,
          null,
          null,
          null,
          null,
          existing?.checkIn,
          existing?.checkOut,
        );
      });

      for (const ticket of plan.tickets) {
        await this.validateTicketHours(ticket, otConfig);
      }
    }

    await this.otPlanRepository.save(plan);
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
    await this.otPlanRepository.save(plan);
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
    await this.otPlanRepository.save(plan);
    await this.generateTickets(plan);

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
    await this.otPlanRepository.save(plan);
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
    await this.otPlanRepository.save(plan);
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

  // ===== Private =====

  private async validateTicketHours(
    ticket: OTTicket,
    otConfig: OTConfig,
  ): Promise<void> {
    const totalHours = ticket.totalHours;

    if (ticket.isOvernight()) {
      const midnight = new Date(ticket.workDate);
      midnight.setHours(24, 0, 0, 0);

      const hoursDay1 =
        (midnight.getTime() - ticket.startTime.getTime()) / (1000 * 60 * 60);
      const hoursDay2 =
        (ticket.endTime.getTime() -
          new Date(ticket.endDate.toDateString()).getTime()) /
        (1000 * 60 * 60);

      if (!otConfig.isOvernightValid(hoursDay1, hoursDay2)) {
        throw new BadRequestException(
          `User ${ticket.userId}: Overnight OT vượt max ${otConfig.maxHoursPerDay}h/ngày`,
        );
      }

      const [usedDay1, usedDay2, usedThisMonth, usedThisYear] =
        await Promise.all([
          this.otTicketService.sumHoursByUserAndDay(
            ticket.userId,
            ticket.workDate,
          ),
          this.otTicketService.sumHoursByUserAndDay(
            ticket.userId,
            ticket.endDate,
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

      if (usedDay1 + hoursDay1 > otConfig.maxHoursPerDay) {
        throw new BadRequestException(
          `User ${ticket.userId} (${ticket.workDate.toDateString()}): Vượt giới hạn ${otConfig.maxHoursPerDay}h/ngày`,
        );
      }

      if (usedDay2 + hoursDay2 > otConfig.maxHoursPerDay) {
        throw new BadRequestException(
          `User ${ticket.userId} (${ticket.endDate.toDateString()}): Vượt giới hạn ${otConfig.maxHoursPerDay}h/ngày`,
        );
      }

      const { valid, errors } = otConfig.validateHours({
        requestedHours: totalHours,
        usedHoursToday: 0,
        usedHoursThisMonth: usedThisMonth,
        usedHoursThisYear: usedThisYear,
      });

      if (!valid) {
        throw new BadRequestException(
          `User ${ticket.userId}: ${errors.join(', ')}`,
        );
      }
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

      if (!valid) {
        throw new BadRequestException(
          `User ${ticket.userId}: ${errors.join(', ')}`,
        );
      }
    }
  }

  private async generateTickets(plan: OTPlan): Promise<void> {
    for (const ticket of plan.tickets) {
      await this.otTicketService.create(ticket);
    }
  }
}
