export class CompensationBalance {
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public hours: number,
    updatedAt?: Date,
  ) {
    this.updatedAt = updatedAt ?? new Date();
    this.hours = hours ?? 0;
  }

  addHours(hours: number): void {
    if (hours > 0) {
      this.hours += hours;
      this.touch();
    }
  }

  deductHours(hours: number): void {
    if (hours > 0) {
      this.hours -= hours;
      this.touch();
    }
  }

  canDeduct(hours: number): boolean {
    return this.hours >= hours;
  }

  getBalance(): number {
    return this.hours;
  }

  getBalanceInDays(hoursPerDay: number = 8): number {
    return this.hours / hoursPerDay;
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
