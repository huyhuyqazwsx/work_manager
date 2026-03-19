import { Injectable } from '@nestjs/common';
import { OTTicket as PrismaOTTicket } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { OTTicket } from '@domain/entities/ot-ticket.entity';
import { OTTicketMapper } from './ot-ticket.mapper';
import { OTTicketStatus } from '@domain/enum/enum';
import { IOTTicketRepository } from '@modules/ot-ticket/domain/repositories/ot-ticket.repository.interface';

@Injectable()
export class PrismaOTTicketRepository
  extends BasePrismaRepository<OTTicket, PrismaOTTicket>
  implements IOTTicketRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.oTTicket as unknown as PrismaDelegate<PrismaOTTicket>,
      OTTicketMapper,
    );
  }

  async findByPlanId(planId: string): Promise<OTTicket[]> {
    const raws = await this.prismaModel.findMany({
      where: { planId },
      orderBy: { workDate: 'asc' },
    });
    return raws.map((r) => OTTicketMapper.toDomain(r));
  }

  async findByUserId(userId: string): Promise<OTTicket[]> {
    const raws = await this.prismaModel.findMany({
      where: { userId },
      orderBy: { workDate: 'desc' },
    });
    return raws.map((r) => OTTicketMapper.toDomain(r));
  }

  async findByStatus(status: OTTicketStatus): Promise<OTTicket[]> {
    const raws = await this.prismaModel.findMany({
      where: { status },
      orderBy: { workDate: 'desc' },
    });
    return raws.map((r) => OTTicketMapper.toDomain(r));
  }

  async findByUserAndStatus(
    userId: string,
    status: OTTicketStatus,
  ): Promise<OTTicket[]> {
    const raws = await this.prismaModel.findMany({
      where: { userId, status },
      orderBy: { workDate: 'desc' },
    });
    return raws.map((r) => OTTicketMapper.toDomain(r));
  }

  async sumHoursByUserAndMonth(userId: string, date: Date): Promise<number> {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const tickets = await this.prismaModel.findMany({
      where: {
        userId,
        status: {
          notIn: [
            OTTicketStatus.CANCELLED,
            OTTicketStatus.EXPIRED,
            OTTicketStatus.REJECTED,
            OTTicketStatus.SCHEDULED,
            OTTicketStatus.IN_PROGRESS,
          ],
        },
        OR: [
          { checkIn: { gte: start, lt: end } },
          { checkOut: { gte: start, lt: end } },
          { startTime: { gte: start, lt: end } },
          { endTime: { gte: start, lt: end } },
        ],
      },
    });

    return tickets.reduce((total, ticket) => {
      if (
        (ticket.status as OTTicketStatus) === OTTicketStatus.COMPLETED ||
        (ticket.status as OTTicketStatus) === OTTicketStatus.VERIFIED
      ) {
        return total + (ticket.actualHours ?? 0);
      }
      return total;
    }, 0);
  }

  async sumHoursByUserAndYear(userId: string, date: Date): Promise<number> {
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear() + 1, 0, 1);

    const tickets = await this.prismaModel.findMany({
      where: {
        userId,
        status: {
          notIn: [
            OTTicketStatus.CANCELLED,
            OTTicketStatus.EXPIRED,
            OTTicketStatus.REJECTED,
            OTTicketStatus.SCHEDULED,
            OTTicketStatus.IN_PROGRESS,
          ],
        },
        OR: [
          { checkIn: { gte: start, lt: end } },
          { checkOut: { gte: start, lt: end } },
          { startTime: { gte: start, lt: end } },
          { endTime: { gte: start, lt: end } },
        ],
      },
    });

    return tickets.reduce((total, ticket) => {
      if (
        (ticket.status as OTTicketStatus) === OTTicketStatus.COMPLETED ||
        (ticket.status as OTTicketStatus) === OTTicketStatus.VERIFIED
      ) {
        return total + (ticket.actualHours ?? 0);
      }
      return total;
    }, 0);
  }

  async sumHoursByUserAndDay(userId: string, date: Date): Promise<number> {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );

    const tickets = await this.prismaModel.findMany({
      where: {
        userId,
        status: {
          notIn: [
            OTTicketStatus.CANCELLED,
            OTTicketStatus.EXPIRED,
            OTTicketStatus.REJECTED,
            OTTicketStatus.SCHEDULED,
            OTTicketStatus.IN_PROGRESS,
          ],
        },
        OR: [
          { checkIn: { gte: start, lt: end } },
          { checkOut: { gte: start, lt: end } },
          { startTime: { gte: start, lt: end } },
          { endTime: { gte: start, lt: end } },
        ],
      },
    });

    return tickets.reduce((total, ticket) => {
      if (
        (ticket.status as OTTicketStatus) === OTTicketStatus.COMPLETED ||
        (ticket.status as OTTicketStatus) === OTTicketStatus.VERIFIED
      ) {
        return total + (ticket.actualHours ?? 0);
      }
      return total;
    }, 0);
  }

  async findPendingLifecycleBatch(limit: number): Promise<OTTicket[]> {
    const raws = await this.prismaModel.findMany({
      where: {
        status: {
          in: [OTTicketStatus.SCHEDULED, OTTicketStatus.IN_PROGRESS],
        },
      },
      orderBy: { workDate: 'asc' },
      take: limit,
    });

    return raws.map((r) => OTTicketMapper.toDomain(r));
  }

  async updateManyTickets(tickets: OTTicket[]): Promise<void> {
    await this.prisma.$transaction(
      tickets.map((ticket) =>
        this.prisma.oTTicket.update({
          where: { id: ticket.id },
          data: OTTicketMapper.toPersistence(ticket),
        }),
      ),
    );
  }

  async expireMany(ids: string[]): Promise<void> {
    await this.prismaModel.updateMany({
      where: { id: { in: ids } },
      data: {
        status: OTTicketStatus.EXPIRED,
        updatedAt: new Date(),
      },
    });
  }
}
