import { ContractType } from '../enum/enum';

export class OTConfig {
  constructor(
    public readonly id: string,
    public readonly contractType: ContractType,
    public maxHoursPerDay: number,
    public maxHoursPerMonth: number,
    public maxHoursPerYear: number,
    public salaryMultiplier: number,
    public isActive: boolean,
  ) {}

  validateRequest(params: {
    requestedHours: number;
    usedHoursToday: number;
    usedHoursThisMonth: number;
    usedHoursThisYear: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.usedHoursToday + params.requestedHours > this.maxHoursPerDay) {
      errors.push(
        `Vượt giới hạn OT/ngày. Tối đa: ${this.maxHoursPerDay}h, ` +
          `Đã dùng: ${params.usedHoursToday}h, Xin thêm: ${params.requestedHours}h`,
      );
    }

    if (
      params.usedHoursThisMonth + params.requestedHours >
      this.maxHoursPerMonth
    ) {
      errors.push(
        `Vượt giới hạn OT/tháng. Tối đa: ${this.maxHoursPerMonth}h, ` +
          `Đã dùng: ${params.usedHoursThisMonth}h, Xin thêm: ${params.requestedHours}h`,
      );
    }

    if (
      params.usedHoursThisYear + params.requestedHours >
      this.maxHoursPerYear
    ) {
      errors.push(
        `Vượt giới hạn OT/năm. Tối đa: ${this.maxHoursPerYear}h, ` +
          `Đã dùng: ${params.usedHoursThisYear}h, Xin thêm: ${params.requestedHours}h`,
      );
    }

    return { valid: errors.length === 0, errors };
  }
}
