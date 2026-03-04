import { PaidPersonalLeaveEvent as PrismaPaidPersonalLeaveEvent } from '@prisma/client';
import { PaidPersonalEventCode } from '@domain/enum/enum';
import { PaidPersonalLeaveEvent } from '@domain/entities/paid-personal-leave-event.entity';

export class PaidPersonalLeaveEventMapper {
  static toDomain(raw: PrismaPaidPersonalLeaveEvent): PaidPersonalLeaveEvent {
    return new PaidPersonalLeaveEvent(
      raw.id,
      raw.code as PaidPersonalEventCode,
      raw.name,
      raw.allowedDays,
      raw.resetOnUse,
    );
  }

  static toPersistence(
    entity: PaidPersonalLeaveEvent | Partial<PaidPersonalLeaveEvent>,
  ): Record<string, any> {
    return { ...entity };
  }
}
