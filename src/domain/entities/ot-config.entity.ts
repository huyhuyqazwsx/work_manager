export class OTConfig {
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public maxHoursPerDay: number,
    public maxHoursPerMonth: number,
    public maxHoursPerYear: number,
    public isActive: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromPlain(plain: {
    id: string;
    maxHoursPerDay: number;
    maxHoursPerMonth: number;
    maxHoursPerYear: number;
    isActive: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }): OTConfig {
    return new OTConfig(
      plain.id,
      plain.maxHoursPerDay,
      plain.maxHoursPerMonth,
      plain.maxHoursPerYear,
      plain.isActive,
      plain.createdAt ? new Date(plain.createdAt) : undefined,
      plain.updatedAt ? new Date(plain.updatedAt) : undefined,
    );
  }

  validateHours(params: {
    requestedHours: number;
    usedHoursToday: number;
    usedHoursThisMonth: number;
    usedHoursThisYear: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.usedHoursToday + params.requestedHours > this.maxHoursPerDay) {
      errors.push(
        `Exceeded daily OT limit. Maximum: ${this.maxHoursPerDay}h, ` +
          `Already used: ${params.usedHoursToday}h, Requested: ${params.requestedHours}h`,
      );
    }

    if (
      params.usedHoursThisMonth + params.requestedHours >
      this.maxHoursPerMonth
    ) {
      errors.push(
        `Exceeded monthly OT limit. Maximum: ${this.maxHoursPerMonth}h, ` +
          `Already used: ${params.usedHoursThisMonth}h, Requested: ${params.requestedHours}h`,
      );
    }

    if (
      params.usedHoursThisYear + params.requestedHours >
      this.maxHoursPerYear
    ) {
      errors.push(
        `Exceeded yearly OT limit. Maximum: ${this.maxHoursPerYear}h, ` +
          `Already used: ${params.usedHoursThisYear}h, Requested: ${params.requestedHours}h`,
      );
    }

    return { valid: errors.length === 0, errors };
  }

  isOvernightValid(hoursDay1: number, hoursDay2: number): boolean {
    return hoursDay1 <= this.maxHoursPerDay && hoursDay2 <= this.maxHoursPerDay;
  }
}
