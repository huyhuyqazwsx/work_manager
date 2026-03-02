import { ContractType } from '../enum/enum';

export class LeaveConfig {
  constructor(
    public readonly id: string,
    public readonly contractType: ContractType,
    public baseDaysPerYear: number,
    public bonusDaysPerCycle: number,
    public bonusYearCycle: number,
    public maxDaysPerRequest: number,
    public minimumNoticeDays: number,
    public prorateByMonth: boolean,
    public joinDateCutoffDay: number,
    public carryOverDays: number,
    public allowNegativeBalance: boolean,
    public isActive: boolean,
  ) {}

  calculateAllowedDays(params: {
    joinDate: Date;
    targetYear: number;
    yearsOfService: number;
  }): number {
    const bonusDays = this.calculateBonusDays(params.yearsOfService);
    const totalBase = this.baseDaysPerYear + bonusDays;

    if (params.joinDate.getFullYear() === params.targetYear) {
      return this.calculateProratedDays(params.joinDate, totalBase);
    }

    return totalBase;
  }

  calculateBonusDays(yearsOfService: number): number {
    if (this.bonusYearCycle === 0) return 0;
    return (
      Math.floor(yearsOfService / this.bonusYearCycle) * this.bonusDaysPerCycle
    );
  }

  calculateProratedDays(joinDate: Date, totalDays: number): number {
    if (!this.prorateByMonth) return totalDays;
    const month = joinDate.getMonth() + 1;
    const day = joinDate.getDate();
    const effectiveMonth = day <= this.joinDateCutoffDay ? month : month + 1;
    const workingMonths = 13 - effectiveMonth;
    return Math.floor((workingMonths / 12) * totalDays);
  }

  validateRequest(params: {
    requestedDays: number;
    requestDate: Date;
    leaveStartDate: Date;
    currentBalance: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.requestedDays > this.maxDaysPerRequest) {
      errors.push(
        `Tối đa ${this.maxDaysPerRequest} ngày/lần. Bạn xin ${params.requestedDays} ngày.`,
      );
    }

    const daysDiff = Math.floor(
      (params.leaveStartDate.getTime() - params.requestDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysDiff < this.minimumNoticeDays) {
      errors.push(
        `Cần báo trước ${this.minimumNoticeDays} ngày. Bạn chỉ báo trước ${daysDiff} ngày.`,
      );
    }

    if (
      !this.allowNegativeBalance &&
      params.requestedDays > params.currentBalance
    ) {
      errors.push(
        `Không đủ số ngày phép. Còn lại: ${params.currentBalance}, Xin: ${params.requestedDays}`,
      );
    }

    return { valid: errors.length === 0, errors };
  }
}
