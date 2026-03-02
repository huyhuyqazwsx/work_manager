import { PaidPersonalEventCode } from '../enum/enum';

export class PaidPersonalLeaveEvent {
  constructor(
    public readonly id: string,
    public readonly code: PaidPersonalEventCode,
    public readonly name: string,
    public readonly allowedDays: number,
    public readonly resetOnUse: boolean,
  ) {}
}
