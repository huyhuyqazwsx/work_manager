import { PaidPersonalEventCode } from '../enum/enum';

export class PaidPersonalLeaveEvent {
  constructor(
    public readonly id: string,
    public readonly code: PaidPersonalEventCode,
    public readonly name: string,
    public readonly allowedDays: number,
    public readonly resetOnUse: boolean,
  ) {}

  static fromPlain(plain: {
    id: string;
    code: PaidPersonalEventCode;
    name: string;
    allowedDays: number;
    resetOnUse: boolean;
  }): PaidPersonalLeaveEvent {
    return new PaidPersonalLeaveEvent(
      plain.id,
      plain.code,
      plain.name,
      plain.allowedDays,
      plain.resetOnUse,
    );
  }
}
