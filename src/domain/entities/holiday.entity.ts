import { HolidaySession, HolidayType } from '../enum/enum';

export class Holiday {
  public readonly createdAt: Date;

  constructor(
    public readonly id: string,
    public name: string,
    public readonly date: Date,
    public readonly type: HolidayType,
    public readonly session: HolidaySession,
    public readonly isRecurring: boolean,
    public readonly createdBy: string,
    createdAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.isRecurring = isRecurring ?? false;
  }

  updateName(name: string): void {
    this.name = name;
  }

  isFixed(): boolean {
    return this.type === HolidayType.FIXED;
  }

  isCustom(): boolean {
    return this.type === HolidayType.CUSTOM;
  }

  isFullDay(): boolean {
    return this.session === HolidaySession.FULL;
  }

  isMorning(): boolean {
    return this.session === HolidaySession.MORNING;
  }

  isAfternoon(): boolean {
    return this.session === HolidaySession.AFTERNOON;
  }

  isHalfDay(): boolean {
    return this.isMorning() || this.isAfternoon();
  }

  getDayValue(): number {
    return this.isFullDay() ? 1 : 0.5;
  }

  isToday(): boolean {
    const today = new Date();
    return (
      this.date.getDate() === today.getDate() &&
      this.date.getMonth() === today.getMonth() &&
      this.date.getFullYear() === today.getFullYear()
    );
  }

  isPast(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.date < today;
  }

  isFuture(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.date > today;
  }

  shouldRecurNextYear(): boolean {
    return this.isRecurring;
  }
}
