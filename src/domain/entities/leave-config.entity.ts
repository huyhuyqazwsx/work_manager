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
  getTotalBase(signDate: Date, targetYear: number) {
    const now = new Date();
    const yearsOfService = this.calculateYearsOfServiceAtYear(
      signDate,
      targetYear,
      now,
    );
    const bonus = this.calculateBonusDays(yearsOfService);
    return this.baseDaysPerYear + bonus;
  }
  calculateAllowedDays(params: {
    signDate: Date | null;
    targetYear: number;
  }): number {
    if (!params.signDate) return 0;

    const now = new Date();
    const nowYear = now.getFullYear();

    if (nowYear < params.targetYear) return 0;

    // signDate sau targetYear → chưa join
    if (params.signDate > new Date(params.targetYear, 11, 31)) return 0;
    if (params.signDate > now) return 0;

    const eligibleMonths = this.calculateCompletedMonths(
      params.signDate,
      params.targetYear,
      now,
    );

    const monthlyBase = this.baseDaysPerYear / 12;
    const accruedBaseDays = Math.round(monthlyBase * eligibleMonths);

    const yearsOfServiceAtTarget = this.calculateYearsOfServiceAtYear(
      params.signDate,
      params.targetYear,
      now,
    );

    const bonusDays = this.calculateBonusDays(yearsOfServiceAtTarget);

    return accruedBaseDays + bonusDays;
  }

  private calculateYearsOfServiceAtYear(
    signDate: Date,
    targetYear: number,
    now: Date,
  ): number {
    const endOfTargetYear = new Date(targetYear, 11, 31);
    const referenceDate = now < endOfTargetYear ? now : endOfTargetYear;

    const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365;
    const years = Math.floor(
      (referenceDate.getTime() - signDate.getTime()) / MS_PER_YEAR,
    );

    return Math.max(0, years);
  }

  calculateBonusDays(yearsOfService: number): number {
    if (this.bonusYearCycle === 0) return 0;
    return (
      Math.floor(yearsOfService / this.bonusYearCycle) * this.bonusDaysPerCycle
    );
  }

  private calculateCompletedMonths(
    signDate: Date,
    targetYear: number,
    now: Date,
  ): number {
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31);

    const end =
      now.getFullYear() === targetYear
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : yearEnd;

    let start = signDate > yearStart ? signDate : yearStart;

    const day = start.getDate();

    if (day > this.joinDateCutoffDay) {
      start = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    } else {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
    }

    if (start > end) return 0;

    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    return Math.max(0, months);
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
