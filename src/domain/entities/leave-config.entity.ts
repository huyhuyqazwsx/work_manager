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
    return 13 - effectiveMonth;
  }

  // Validate request

  hasEnoughBalance(requestedDays: number, currentBalance: number): boolean {
    if (this.allowNegativeBalance) return true;
    return requestedDays <= currentBalance;
  }

  hasEnoughNotice(leaveStartDate: Date): boolean {
    const daysDiff = Math.floor(
      (leaveStartDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysDiff >= this.minimumNoticeDays;
  }

  isWithinMaxDaysPerRequest(requestedDays: number): boolean {
    return requestedDays <= this.maxDaysPerRequest;
  }
}
