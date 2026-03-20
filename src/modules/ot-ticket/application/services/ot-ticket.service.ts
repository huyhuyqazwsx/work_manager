import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { IOTTicketService } from '../interfaces/ot-ticket.service.interface';
import * as otTicketRepositoryInterface from '../../domain/repositories/ot-ticket.repository.interface';
import * as compensationServiceInterface from '../../../compensation/application/interfaces/compensation.service.interface';
import { OTTicket } from '@domain/entities/ot-ticket.entity';
import { OTType } from '@domain/enum/enum';
import { AppError, AppException } from '@domain/errors';

@Injectable()
export class OTTicketService
  extends BaseCrudService<OTTicket>
  implements IOTTicketService
{
  constructor(
    @Inject('IOTTicketRepository')
    private readonly otTicketRepository: otTicketRepositoryInterface.IOTTicketRepository,
    @Inject('ICompensationService')
    private readonly compensationService: compensationServiceInterface.ICompensationService,
  ) {
    super(otTicketRepository);
  }
  async sumHoursByUserAndMonth(userId: string, date: Date): Promise<number> {
    return this.otTicketRepository.sumHoursByUserAndMonth(userId, date);
  }

  async sumHoursByUserAndYear(userId: string, date: Date): Promise<number> {
    return this.otTicketRepository.sumHoursByUserAndYear(userId, date);
  }

  async sumHoursByUserAndDay(userId: string, date: Date): Promise<number> {
    return this.otTicketRepository.sumHoursByUserAndDay(userId, date);
  }

  async getTicketById(ticketId: string): Promise<OTTicket> {
    const ticket = await this.otTicketRepository.findById(ticketId);
    if (!ticket)
      if (!ticket)
        throw new AppException(
          AppError.OT_TICKET_NOT_FOUND,
          `OTTicket not found: "${ticketId}"`,
          HttpStatus.NOT_FOUND,
        );
    return ticket;
  }

  async getTicketsByPlan(planId: string): Promise<OTTicket[]> {
    return this.otTicketRepository.findByPlanId(planId);
  }

  async getMyTickets(userId: string): Promise<OTTicket[]> {
    return this.otTicketRepository.findByUserId(userId);
  }

  async checkIn(
    ticketId: string,
    userId: string,
    plan: string,
    otType: OTType,
  ): Promise<OTTicket> {
    const ticket = await this.getTicketById(ticketId);

    if (ticket.userId != userId) {
      throw new AppException(
        AppError.OT_TICKET_FORBIDDEN,
        'You are not allowed to check in this ticket',
        HttpStatus.FORBIDDEN,
      );
    }

    const start = new Date(ticket.startTime);

    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);

    const now = new Date();

    if (!ticket.isScheduled()) {
      throw new AppException(
        AppError.OT_TICKET_INVALID_STATUS,
        `Cannot check in ticket with status "${ticket.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (now < startOfDay || now > endOfDay) {
      throw new AppException(
        AppError.BAD_REQUEST,
        'Expired check in',
        HttpStatus.BAD_REQUEST,
      );
    }

    ticket.checkInNow(plan);
    ticket.otType = otType;
    await this.otTicketRepository.update(ticketId, ticket);
    return ticket;
  }

  async checkOut(
    ticketId: string,
    userId: string,
    result: string,
  ): Promise<OTTicket> {
    const ticket = await this.getTicketById(ticketId);

    if (ticket.userId !== userId) {
      throw new AppException(
        AppError.OT_TICKET_FORBIDDEN,
        'You are not allowed to check out this ticket',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!ticket.isInProgress()) {
      throw new AppException(
        AppError.OT_TICKET_INVALID_STATUS,
        `Cannot check out ticket with status "${ticket.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    ticket.checkOutNow(result);
    await this.otTicketRepository.update(ticketId, ticket);
    return ticket;
  }

  async verify(
    ticketId: string,
    managerId: string,
    actualHours?: number,
  ): Promise<OTTicket> {
    const ticket = await this.getTicketById(ticketId);

    if (!ticket.isCompleted()) {
      throw new AppException(
        AppError.OT_TICKET_INVALID_STATUS,
        `Cannot verify ticket with status "${ticket.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    ticket.verify(managerId);
    if (actualHours) ticket.actualHours = actualHours;

    await this.otTicketRepository.runInTransaction(async (tx) => {
      await this.otTicketRepository.update(ticketId, ticket, tx);

      if (ticket.isCompensation() && ticket.actualHours) {
        await this.compensationService.earnHours(
          ticket.userId,
          ticket.workDate.getFullYear(),
          ticket.actualHours,
          tx,
        );
      }
    });

    return ticket;
  }

  async reject(ticketId: string, note: string): Promise<OTTicket> {
    const ticket = await this.getTicketById(ticketId);

    if (!ticket.isCompleted()) {
      throw new AppException(
        AppError.OT_TICKET_INVALID_STATUS,
        `Cannot reject ticket with status "${ticket.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    ticket.rejectByManager(note);
    await this.otTicketRepository.update(ticketId, ticket);
    return ticket;
  }

  async cancel(ticketId: string, userId: string): Promise<OTTicket> {
    const ticket = await this.getTicketById(ticketId);

    if (ticket.userId !== userId) {
      throw new AppException(
        AppError.OT_TICKET_FORBIDDEN,
        'You are not allowed to cancel this ticket',
        HttpStatus.FORBIDDEN,
      );
    }

    const now = new Date().getTime();
    const isBeforeStart = now <= ticket.startTime.getTime();

    if (!ticket.isScheduled() || !isBeforeStart) {
      throw new AppException(
        AppError.OT_TICKET_INVALID_STATUS,
        `Cannot cancel ticket with status "${ticket.status}" or past start time`,
        HttpStatus.BAD_REQUEST,
      );
    }

    ticket.cancel();
    await this.otTicketRepository.update(ticketId, ticket);

    return ticket;
  }

  async processOTTicketLifecycle(): Promise<void> {
    const BATCH_SIZE = 50;
    const tickets =
      await this.otTicketRepository.findPendingLifecycleBatch(BATCH_SIZE);

    if (!tickets.length) return;

    const now = new Date();
    const expiredAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const expiredIds: string[] = [];
    const toAutoComplete: OTTicket[] = [];

    for (const ticket of tickets) {
      if (
        ticket.isScheduled() &&
        ticket.startTime &&
        ticket.startTime < expiredAt
      ) {
        ticket.expire();
        expiredIds.push(ticket.id);
        continue;
      }

      if (ticket.isInProgress() && ticket.checkIn) {
        const maxAllowed = new Date(
          ticket.checkIn.getTime() + 24 * 60 * 60 * 1000,
        );
        if (now > maxAllowed) {
          const autoCheckout = new Date(
            ticket.checkIn.getTime() +
              (ticket.totalHours ?? 0) * 60 * 60 * 1000,
          );
          ticket.autoComplete(autoCheckout);
          toAutoComplete.push(ticket);
        }
      }
    }

    // 1 query
    if (expiredIds.length) {
      await this.otTicketRepository.expireMany(expiredIds);
    }

    //N query
    if (toAutoComplete.length) {
      await this.otTicketRepository.updateManyTickets(toAutoComplete);
    }
  }
}
