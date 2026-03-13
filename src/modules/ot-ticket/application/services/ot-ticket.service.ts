import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { IOTTicketService } from '../interfaces/ot-ticket.service.interface';
import * as otTicketRepositoryInterface from '../../domain/repositories/ot-ticket.repository.interface';
import * as compensationServiceInterface from '../../../compensation/application/interfaces/compensation.service.interface';
import { OTTicket } from '@domain/entities/ot-ticket.entity';

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
      throw new NotFoundException(`OTTicket not found: "${ticketId}"`);
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
  ): Promise<OTTicket> {
    const ticket = await this.getTicketById(ticketId);

    if (ticket.userId !== userId) {
      throw new BadRequestException(
        'You are not allowed to check in this ticket',
      );
    }

    if (!ticket.isScheduled()) {
      throw new BadRequestException(
        `Cannot check in ticket with status "${ticket.status}"`,
      );
    }

    ticket.checkInNow(plan);
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
      throw new BadRequestException(
        'You are not allowed to check out this ticket',
      );
    }

    if (!ticket.isInProgress()) {
      throw new BadRequestException(
        `Cannot check out ticket with status "${ticket.status}"`,
      );
    }

    ticket.checkOutNow(result);
    await this.otTicketRepository.update(ticketId, ticket);
    return ticket;
  }

  async verify(ticketId: string, managerId: string): Promise<OTTicket> {
    const ticket = await this.getTicketById(ticketId);

    if (!ticket.isCompleted()) {
      throw new BadRequestException(
        `Cannot verify ticket with status "${ticket.status}"`,
      );
    }

    ticket.verify(managerId);

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
      throw new BadRequestException(
        `Cannot reject ticket with status "${ticket.status}"`,
      );
    }

    ticket.rejectByManager(note);
    await this.otTicketRepository.update(ticketId, ticket);
    return ticket;
  }

  async cancel(ticketId: string, userId: string): Promise<OTTicket> {
    const ticket = await this.getTicketById(ticketId);

    if (ticket.userId !== userId) {
      throw new BadRequestException(
        'You are not allowed to cancel this ticket',
      );
    }

    if (!ticket.isScheduled()) {
      throw new BadRequestException(
        `Cannot cancel ticket with status "${ticket.status}"`,
      );
    }

    ticket.cancel();
    await this.otTicketRepository.update(ticketId, ticket);

    return ticket;
  }

  //TODO implement cron job handle
  async processOTTicketLifecycle(): Promise<void> {
    const BATCH_SIZE = 50;
    let offset = 0;

    while (true) {
      const tickets = await this.otTicketRepository.findPendingLifecycleBatch(
        BATCH_SIZE,
        offset,
      );

      if (!tickets.length) break;

      const now = new Date();
      const expiredAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const toUpdate: OTTicket[] = [];

      for (const ticket of tickets) {
        if (
          ticket.isScheduled() &&
          ticket.startTime &&
          ticket.startTime < expiredAt
        ) {
          ticket.expire();
          toUpdate.push(ticket);
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
            toUpdate.push(ticket);
          }
        }
      }

      if (toUpdate.length) {
        await this.otTicketRepository.updateManyTickets(toUpdate);
      }

      if (tickets.length < BATCH_SIZE) break;
      offset += BATCH_SIZE;
    }
  }
}
