import { OTTicket } from '@domain/entities/ot-ticket.entity';
import { OTTicket as PrismaOTTicket } from '@prisma/client';
import { OTTicketStatus, OTType } from '@domain/enum/enum';

export class OTTicketMapper {
  static toDomain(raw: PrismaOTTicket): OTTicket {
    return new OTTicket(
      raw.id,
      raw.planId,
      raw.userId,
      raw.otType as OTType,
      raw.workDate,
      raw.endDate,
      raw.startTime,
      raw.endTime,
      raw.totalHours,
      raw.status as OTTicketStatus,
      raw.plan ?? null,
      raw.result ?? null,
      raw.actualHours ?? null,
      raw.verifiedBy ?? null,
      raw.rejectNote ?? null,
      raw.checkIn ?? undefined,
      raw.checkOut ?? undefined,
      raw.createdAt,
      raw.updatedAt,
      raw.verifiedAt ?? undefined,
    );
  }

  static toPersistence(
    entity: OTTicket | Partial<OTTicket>,
  ): Record<string, any> {
    return { ...entity };
  }
}
