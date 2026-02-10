export class LeavePolicyValue {
  constructor(
    public readonly id: string,
    public readonly policyId: string,
    public readonly leaveTypeId: string,
    public maxDaysPerRequest: number,
    public minimumNoticeDays: number,
    public allowNegativeBalance: boolean,
  ) {
    this.allowNegativeBalance = allowNegativeBalance ?? false;
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
