export class OvertimeType {
  public readonly createdAt: Date;

  constructor(
    public readonly id: string,
    public readonly code: string,
    public name: string,
    public defaultMultiplier: number,
    public isCompensation: boolean,
    createdAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.isCompensation = isCompensation ?? false;
  }

  updateName(name: string): void {
    if (this.name !== name) {
      this.name = name;
    }
  }

  updateMultiplier(multiplier: number): void {
    if (multiplier > 0) {
      this.defaultMultiplier = multiplier;
    }
  }

  setCompensation(isCompensation: boolean): void {
    this.isCompensation = isCompensation;
  }

  isPaidOT(): boolean {
    return !this.isCompensation;
  }

  isCompensationOT(): boolean {
    return this.isCompensation;
  }

  calculateSalary(baseHourlyRate: number, hours: number): number {
    if (this.isPaidOT()) {
      return baseHourlyRate * hours * this.defaultMultiplier;
    }
    return 0;
  }

  calculateCompensationHours(hours: number): number {
    if (this.isCompensationOT()) {
      return hours * this.defaultMultiplier;
    }
    return 0;
  }
}
