export class CompensationBalance {
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly userCode: string,
    public readonly year: number,
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

  getBalanceInDays(): number {
    const days = this.hours / 8;
    return Math.floor(days * 2) / 2;
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
