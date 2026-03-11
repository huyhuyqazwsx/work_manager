import { HolidaySession, LeaveRequestStatus } from '../enum/enum';

export class LeaveRequest {
  public readonly createdAt: Date;
  public approvedAt?: Date | null;

  constructor(
    public readonly id: string,
    public leaveTypeId: string,
    public status: LeaveRequestStatus,
    public fromDate: Date,
    public toDate: Date,
    public fromSession: HolidaySession,
    public toSession: HolidaySession,
    public totalDays: number,
    public paidDays: number,
    public unpaidDays: number,
    public reason: string | null,
    public readonly createdBy: string,
    public approvedBy: string | null,
    public paidPersonalEventCode: string | null,
    public attachmentUrl: string | null,
    createdAt?: Date,
    approvedAt?: Date | null,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.approvedAt = approvedAt ?? null;
    this.status = status ?? LeaveRequestStatus.PENDING;
    this.approvedBy = approvedBy ?? null;
  }

  updateReason(reason: string): void {
    this.reason = reason;
  }

  approve(approvedBy: string): void {
    if (this.isPending()) {
      this.status = LeaveRequestStatus.APPROVED;
      this.approvedBy = approvedBy;
      this.approvedAt = new Date();
    }
  }

  reject(approvedBy: string): void {
    if (this.isPending()) {
      this.status = LeaveRequestStatus.REJECTED;
      this.approvedBy = approvedBy;
      this.approvedAt = new Date();
    }
  }

  cancel(): void {
    if (this.isApproved()) {
      this.status = LeaveRequestStatus.CANCELLED;
    }
  }

  isPending(): boolean {
    return this.status === LeaveRequestStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === LeaveRequestStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === LeaveRequestStatus.REJECTED;
  }

  isCancelled(): boolean {
    return this.status === LeaveRequestStatus.CANCELLED;
  }

  canApprove(): boolean {
    return this.isPending();
  }

  canReject(): boolean {
    return this.isPending();
  }

  canCancel(today: Date): boolean {
    return this.isApproved() && this.fromDate > today;
  }

  getDuration(): number {
    return this.totalDays;
  }

  getDateRange(): { from: Date; to: Date } {
    return {
      from: this.fromDate,
      to: this.toDate,
    };
  }
}
