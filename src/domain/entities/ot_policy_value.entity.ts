export class OTPolicyValue {
  constructor(
    public readonly id: string,
    public readonly policyId: string,
    public readonly otTypeId: string,
    public maxHoursPerDay: number,
    public salaryMultiplier: number,
  ) {}

  updateMaxHoursPerDay(hours: number): void {
    if (hours > 0) {
      this.maxHoursPerDay = hours;
    }
  }

  updateSalaryMultiplier(multiplier: number): void {
    if (multiplier > 0) {
      this.salaryMultiplier = multiplier;
    }
  }

  canRequestHours(hours: number): boolean {
    return hours <= this.maxHoursPerDay && hours > 0;
  }

  calculateSalary(baseHourlyRate: number, hours: number): number {
    return baseHourlyRate * hours * this.salaryMultiplier;
  }

  validateRequest(params: {
    requestedHours: number;
    existingHoursToday?: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const totalHours = params.requestedHours + (params.existingHoursToday ?? 0);

    if (!this.canRequestHours(params.requestedHours)) {
      errors.push(
        `Requested hours (${params.requestedHours}) exceeds maximum allowed (${this.maxHoursPerDay})`,
      );
    }

    if (totalHours > this.maxHoursPerDay) {
      errors.push(
        `Total OT hours today (${totalHours}) would exceed maximum allowed (${this.maxHoursPerDay})`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getMaxHours(): number {
    return this.maxHoursPerDay;
  }

  getMultiplier(): number {
    return this.salaryMultiplier;
  }
}
