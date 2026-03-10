import { IBaseRepository } from '@domain/repositories/base.repository';
import { OTTicket } from '@domain/entities/ot-ticket.entity';
import { OTTicketStatus } from '@domain/enum/enum';

export interface IOTTicketRepository extends IBaseRepository<OTTicket> {
  findByPlanId(planId: string): Promise<OTTicket[]>;
  findByUserId(userId: string): Promise<OTTicket[]>;
  findByStatus(status: OTTicketStatus): Promise<OTTicket[]>;
  findByUserAndStatus(
    userId: string,
    status: OTTicketStatus,
  ): Promise<OTTicket[]>;
  sumHoursByUserAndMonth(userId: string, date: Date): Promise<number>;
  sumHoursByUserAndYear(userId: string, date: Date): Promise<number>;
  sumHoursByUserAndDay(userId: string, date: Date): Promise<number>;
  findPendingLifecycleBatch(limit: number, offset: number): Promise<OTTicket[]>;
  updateManyTickets(tickets: OTTicket[]): Promise<void>;
}
