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
import { OTTicketStatus } from '@domain/enum/enum';

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
    await this.otTicketRepository.save(ticket);
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
    await this.otTicketRepository.save(ticket);
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
    await this.otTicketRepository.save(ticket);

    // Cộng vào quỹ nếu COMPENSATION
    if (ticket.isCompensation() && ticket.actualHours) {
      await this.compensationService.earnHours(
        ticket.userId,
        ticket.actualHours,
      );
    }

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
    await this.otTicketRepository.save(ticket);
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
    await this.otTicketRepository.save(ticket);

    return ticket;
  }

  async processOTTicketLifecycle(): Promise<void> {
    const [scheduled, inProgress] = await Promise.all([
      this.otTicketRepository.findByStatus(OTTicketStatus.SCHEDULED),
      this.otTicketRepository.findByStatus(OTTicketStatus.IN_PROGRESS),
    ]);

    const tickets = [...scheduled, ...inProgress];

    const now = new Date();
    const expiredAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const ticket of tickets) {
      if (
        ticket.isScheduled() &&
        ticket.startTime &&
        ticket.startTime < expiredAt
      ) {
        ticket.expire();
        await this.otTicketRepository.save(ticket);
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
          await this.otTicketRepository.save(ticket);
        }
      }
    }
  }
}
