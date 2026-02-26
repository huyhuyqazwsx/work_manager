import { HolidaySession, HolidayType } from '../enum/enum';

export class Holiday {
  public readonly createdAt: Date;

  constructor(
    public readonly id: string,
    public name: string,
    public date: Date,
    public type: HolidayType,
    public session: HolidaySession,
    public isRecurring: boolean,
    public createdBy: string,
    createdAt?: Date,
    public isCompensatory?: boolean,
    public originalHolidayId?: string,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.isRecurring = isRecurring ?? false;
    this.isCompensatory = isCompensatory ?? false;
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

  isWeekend(): boolean {
    const day = this.date.getDay();
    return day === 0 || day === 6;
  }

  needsCompensation(): boolean {
    return (
      this.type === HolidayType.FIXED &&
      this.isWeekend() &&
      !this.isCompensatory
    );
  }

  getCompensatoryDate(): Date {
    if (!this.needsCompensation()) {
      throw new Error('This holiday does not need compensation');
    }

    const compensatoryDate = new Date(this.date);
    const dayOfWeek = this.date.getDay();

    if (dayOfWeek === 6) {
      compensatoryDate.setDate(compensatoryDate.getDate() + 2);
    } else if (dayOfWeek === 0) {
      compensatoryDate.setDate(compensatoryDate.getDate() + 1);
    }

    return compensatoryDate;
  }
}
