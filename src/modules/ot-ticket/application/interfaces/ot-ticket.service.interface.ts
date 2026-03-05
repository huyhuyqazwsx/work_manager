import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';
import { OTTicket } from '@domain/entities/ot-ticket.entity';

export interface IOTTicketService extends IBaseCrudService<OTTicket> {
  getTicketById(ticketId: string): Promise<OTTicket>;
  getTicketsByPlan(planId: string): Promise<OTTicket[]>;
  getMyTickets(userId: string): Promise<OTTicket[]>;
  checkIn(ticketId: string, userId: string, plan: string): Promise<OTTicket>;
  checkOut(ticketId: string, userId: string, result: string): Promise<OTTicket>;
  verify(ticketId: string, managerId: string): Promise<OTTicket>;
  reject(ticketId: string, note: string): Promise<OTTicket>;
  cancel(ticketId: string, managerId: string): Promise<OTTicket>;
  processOTTicketLifecycle(): Promise<void>;
  sumHoursByUserAndMonth(userId: string, date: Date): Promise<number>;
  sumHoursByUserAndYear(userId: string, date: Date): Promise<number>;
  sumHoursByUserAndDay(userId: string, date: Date): Promise<number>;
}
