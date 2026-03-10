import { OTTicketStatus, OTType } from '../enum/enum';

export class OTTicket {
  public checkIn?: Date;
  public checkOut?: Date;
  public verifiedAt?: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly planId: string,
    public readonly userId: string,
    public readonly otType: OTType | null, // COMPENSATION | SALARY
    public readonly workDate: Date, // ngày làm viec (Date only)
    public readonly startTime: Date, // datetime đầy đủ
    public readonly endTime: Date, // datetime đầy đủ (có thể sang ngày hôm sau nếu overnight)
    public readonly totalHours: number,
    public status: OTTicketStatus,
    public plan: string | null, // ghi trước check-in
    public result: string | null, // ghi lúc check-out
    public actualHours: number | null,
    public verifiedBy: string | null,
    public rejectNote: string | null,
    checkIn?: Date,
    checkOut?: Date,
    createdAt?: Date,
    updatedAt?: Date,
    verifiedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.verifiedAt = verifiedAt;
    this.status = status ?? OTTicketStatus.SCHEDULED;
  }

  checkInNow(plan: string): void {
    if (this.isScheduled()) {
      this.checkIn = new Date();
      this.plan = plan;
      this.status = OTTicketStatus.IN_PROGRESS;
      this.touch();
    }
  }

  checkOutNow(result: string): void {
    if (this.isInProgress() && this.checkIn) {
      this.checkOut = new Date();
      this.result = result;
      this.actualHours = this.calculateActualHours();
      this.status = OTTicketStatus.COMPLETED;
      this.touch();
    }
  }

  verify(verifiedBy: string): void {
    if (this.isCompleted()) {
      this.status = OTTicketStatus.VERIFIED;
      this.verifiedBy = verifiedBy;
      this.verifiedAt = new Date();
      this.touch();
    }
  }

  rejectByManager(note: string): void {
    if (this.isCompleted()) {
      this.status = OTTicketStatus.REJECTED;
      this.rejectNote = note;
      this.touch();
    }
  }

  cancel(): void {
    if (this.isScheduled()) {
      this.status = OTTicketStatus.CANCELLED;
      this.touch();
    }
  }

  expire(): void {
    if (this.isScheduled()) {
      this.status = OTTicketStatus.EXPIRED;
      this.touch();
    }
  }

  autoComplete(checkOut: Date): void {
    if (!this.checkIn) {
      throw new Error('Cannot auto complete ticket without check-in');
    }
    this.checkOut = checkOut;
    this.actualHours = Math.max(
      0,
      (this.checkOut.getTime() - this.checkIn.getTime()) / (1000 * 60 * 60),
    );
    this.status = OTTicketStatus.COMPLETED;
    this.touch();
  }

  /** true nếu endTime sang ngày hôm sau so với workDate */
  isOvernight(): boolean {
    const workDateStr = this.workDate.toDateString();
    const endDateStr = this.endTime.toDateString();
    return workDateStr !== endDateStr;
  }

  isCompensation(): boolean {
    return this.otType === OTType.COMPENSATION;
  }

  isSalary(): boolean {
    return this.otType === OTType.SALARY;
  }

  isScheduled(): boolean {
    return this.status === OTTicketStatus.SCHEDULED;
  }
  isInProgress(): boolean {
    return this.status === OTTicketStatus.IN_PROGRESS;
  }
  isCompleted(): boolean {
    return this.status === OTTicketStatus.COMPLETED;
  }
  isVerified(): boolean {
    return this.status === OTTicketStatus.VERIFIED;
  }
  isRejected(): boolean {
    return this.status === OTTicketStatus.REJECTED;
  }
  isExpired(): boolean {
    return this.status === OTTicketStatus.EXPIRED;
  }
  isCancelled(): boolean {
    return this.status === OTTicketStatus.CANCELLED;
  }

  private calculateActualHours(): number {
    if (!this.checkIn || !this.checkOut) return 0;
    if (this.checkOut.getTime() <= this.checkIn.getTime()) return 0;
    return Number(
      (
        (this.checkOut.getTime() - this.checkIn.getTime()) /
        (1000 * 60 * 60)
      ).toFixed(2),
    );
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
