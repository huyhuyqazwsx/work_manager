export class LeavePolicyValue {
  constructor(
    public readonly id: string,
    public readonly policyId: string,
    public readonly leaveTypeId: string,
    public maxDaysPerRequest: number,
    public minimumNoticeDays: number,
    public allowNegativeBalance: boolean,

    public baseDaysPerYear: number, // số ngày phép gốc (12)
    public bonusDaysPerCycle: number, // số ngày thưởng mỗi cycle (1)
    public bonusYearCycle: number, // chu kỳ năm để thưởng (5)
    public prorateByMonth: boolean, // có tính prorated không
    public joinDateCutoffDay: number, // ngày cutoff trong tháng (15)
    public carryOverDays: number, // số ngày được mang sang năm sau (0 = không cộng dồn)
    public allowedContractTypes: string[],
  ) {
    this.allowNegativeBalance = allowNegativeBalance ?? false;
    this.carryOverDays = carryOverDays ?? 0;
    this.bonusDaysPerCycle = bonusDaysPerCycle ?? 0;
    this.bonusYearCycle = bonusYearCycle ?? 0;
    this.prorateByMonth = prorateByMonth ?? true;
    this.joinDateCutoffDay = joinDateCutoffDay ?? 15;
    this.allowedContractTypes = allowedContractTypes ?? [];
  }

  isContractTypeAllowed(contractType: string): boolean {
    if (this.allowedContractTypes.length === 0) return true;
    return this.allowedContractTypes.includes(contractType);
  }

  calculateBonusDays(yearsOfService: number): number {
    if (this.bonusYearCycle === 0) return 0;
    return (
      Math.floor(yearsOfService / this.bonusYearCycle) * this.bonusDaysPerCycle
    );
  }

  calculateTotalBaseDays(yearsOfService: number): number {
    return this.baseDaysPerYear + this.calculateBonusDays(yearsOfService);
  }

  calculateEffectiveFromMonth(joinDate: Date, targetYear: number): number {
    if (joinDate.getFullYear() < targetYear) return 1;
    if (joinDate.getFullYear() > targetYear) return 13; // chưa join
    const month = joinDate.getMonth() + 1;
    const day = joinDate.getDate();
    return day <= this.joinDateCutoffDay ? month : month + 1;
  }

  calculateProratedDays(totalDays: number, effectiveFromMonth: number): number {
    if (!this.prorateByMonth) return totalDays;
    const workingMonths = 13 - effectiveFromMonth; // tháng 1 = 12 tháng, tháng 7 = 6 tháng
    return Math.floor((workingMonths / 12) * totalDays);
  }

  calculateAllowedDays(params: {
    yearsOfService: number;
    joinDate: Date;
    targetYear: number;
    contractMonths: number; // tổng tháng HĐ tính đến cuối năm
  }): { totalDays: number; effectiveFromMonth: number; bonusDays: number } {
    const bonusDays = this.calculateBonusDays(params.yearsOfService);
    const totalBase = this.baseDaysPerYear + bonusDays;
    const effectiveFromMonth = this.calculateEffectiveFromMonth(
      params.joinDate,
      params.targetYear,
    );

    let totalDays: number;
    if (params.contractMonths < 12) {
      totalDays = this.calculateProratedDays(totalBase, effectiveFromMonth);
    } else {
      totalDays = totalBase;
    }

    return { totalDays, effectiveFromMonth, bonusDays };
  }

  updateMaxDaysPerRequest(days: number): void {
    if (days > 0) {
      this.maxDaysPerRequest = days;
    }
  }

  updateMinimumNoticeDays(days: number): void {
    if (days >= 0) {
      this.minimumNoticeDays = days;
    }
  }

  setAllowNegativeBalance(allow: boolean): void {
    this.allowNegativeBalance = allow;
  }

  canRequestDays(days: number): boolean {
    return days <= this.maxDaysPerRequest && days > 0;
  }

  hasEnoughNotice(requestDate: Date, leaveStartDate: Date): boolean {
    const diffTime = leaveStartDate.getTime() - requestDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= this.minimumNoticeDays;
  }

  canGoNegative(): boolean {
    return this.allowNegativeBalance;
  }

  validateRequest(params: {
    requestedDays: number;
    requestDate: Date;
    leaveStartDate: Date;
    currentBalance?: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.canRequestDays(params.requestedDays)) {
      errors.push(
        `Requested days (${params.requestedDays}) exceeds maximum allowed (${this.maxDaysPerRequest})`,
      );
    }

    if (!this.hasEnoughNotice(params.requestDate, params.leaveStartDate)) {
      errors.push(
        `Minimum notice of ${this.minimumNoticeDays} days is required`,
      );
    }

    if (
      params.currentBalance !== undefined &&
      !this.allowNegativeBalance &&
      params.requestedDays > params.currentBalance
    ) {
      errors.push(
        `Insufficient balance. Current: ${params.currentBalance}, Requested: ${params.requestedDays}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getMaxDays(): number {
    return this.maxDaysPerRequest;
  }

  getMinimumNotice(): number {
    return this.minimumNoticeDays;
  }
}
